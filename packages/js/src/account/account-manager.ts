import * as path from 'path';
import * as os from 'os';
import * as process from 'process';
import * as nearAPI from 'near-api-js';
import {NEAR} from 'near-units';
import {asId, isTopLevelAccount, randomAccountId} from '../utils';
import {KeyPair, BN, KeyPairEd25519, FinalExecutionOutcome, KeyStore, AccountBalance, NamedAccount, PublicKey, AccountView, ServerError} from '../types';
import {debug, txDebug} from '../internal-utils';
import {Transaction} from '../transaction';
import {JsonRpcProvider} from '../jsonrpc';
import {Config} from '../interfaces';
import {TransactionResult} from '../transaction-result';
import {Account} from './account';
import {NearAccount} from './near-account';
import {findCallerFile, getKeyFromFile, hashPathBase64, sanitize} from './utils';
import {NearAccountManager} from './near-account-manager';

function timeSuffix(prefix: string, length = 99_999): string {
  return `${prefix}${Date.now() % length}`;
}

async function findAccountsWithPrefix(
  prefix: string,
  keyStore: KeyStore,
  network: string,
): Promise<string[]> {
  const accounts = await keyStore.getAccounts(network);
  debug(`HOME: ${os.homedir()}\nPWD: ${process.cwd()}\nLooking for ${prefix} in:\n  ${accounts.join('\n  ')}`);
  const paths = accounts.filter(f => f.startsWith(prefix));
  if (paths.length > 0) {
    debug(`Found:\n  ${paths.join('\n  ')}`);
    return paths;
  }

  const newAccount = timeSuffix(prefix, 9_999_999);
  debug(`Creating account: ${newAccount}`);
  return [newAccount];
}

export abstract class AccountManager implements NearAccountManager {
  accountsCreated: Set<string> = new Set();
  private _root?: NearAccount;
  constructor(
    protected config: Config,
  ) {}

  static create(
    config: Config,
  ): AccountManager {
    const {network} = config;
    switch (network) {
      case 'sandbox':
        return new SandboxManager(config);
      case 'testnet':
        return new TestnetManager(config);
      default: throw new Error(`Bad network id: "${network as string}"; expected "testnet" or "sandbox"`);
    }
  }

  async accountView(accountId: string): Promise<AccountView> {
    return this.provider.viewAccount(accountId);
  }

  getAccount(accountId: string): NearAccount {
    return new Account(accountId, this);
  }

  getParentAccount(accountId: string): NearAccount {
    const split = accountId.split('.');
    if (split.length === 1) {
      return this.getAccount(accountId);
    }

    return this.getAccount(split.slice(1).join('.'));
  }

  async deleteKey(
    account_id: string,
  ): Promise<void> {
    try {
      await this.keyStore.removeKey(this.networkId, account_id);
      debug(`deleted Key for ${account_id}`);
    } catch {
      debug(`Failed to delete key for ${account_id}`);
    }
  }

  async init(): Promise<AccountManager> {
    return this;
  }

  get root(): NearAccount {
    if (!this._root) {
      this._root = new Account(this.rootAccountId, this);
    }

    return this._root;
  }

  get initialBalance(): string {
    return this.config.initialBalance ?? this.DEFAULT_INITIAL_BALANCE;
  }

  get doubleInitialBalance(): BN {
    return new BN(this.initialBalance).mul(new BN('2'));
  }

  get provider(): JsonRpcProvider {
    return JsonRpcProvider.from(this.config);
  }

  createTransaction(sender: NearAccount | string, receiver: NearAccount | string): Transaction {
    return new ManagedTransaction(this, sender, receiver);
  }

  async getKey(accountId: string): Promise<KeyPair | null> {
    return this.keyStore.getKey(this.networkId, accountId);
  }

  async getPublicKey(accountId: string): Promise<PublicKey | null> {
    return (await this.getKey(accountId))?.getPublicKey() ?? null;
  }

  /** Sets the provided key to store, otherwise creates a new one */
  async setKey(accountId: string, keyPair?: KeyPair): Promise<KeyPair> {
    const key = keyPair ?? KeyPairEd25519.fromRandom();
    await this.keyStore.setKey(this.networkId, accountId, key);
    debug(`Setting keys for ${accountId}`);
    return (await this.getKey(accountId))!;
  }

  async removeKey(accountId: string): Promise<void> {
    await this.keyStore.removeKey(this.networkId, accountId);
  }

  async deleteAccount(accountId: string, beneficiaryId: string, keyPair?: KeyPair): Promise<TransactionResult> {
    try {
      return await this.getAccount(accountId).delete(beneficiaryId, keyPair);
    } catch (error: unknown) {
      if (keyPair) {
        debug(`Failed to delete ${accountId} with different keyPair`);
        return this.deleteAccount(accountId, beneficiaryId);
      }

      throw error;
    }
  }

  async getRootKey(): Promise<KeyPair> {
    const keyPair = await this.getKey(this.rootAccountId);
    if (!keyPair) {
      return this.setKey(this.rootAccountId);
    }

    return keyPair;
  }

  async balance(account: string | NearAccount): Promise<AccountBalance> {
    return this.provider.account_balance(asId(account));
  }

  async availableBalance(account: string | NearAccount): Promise<NEAR> {
    return (await this.balance(account)).available;
  }

  async exists(accountId: string | NearAccount): Promise<boolean> {
    return this.provider.accountExists(asId(accountId));
  }

  async canCoverBalance(account: string | NearAccount, amount: BN): Promise<boolean> {
    return amount.lt(await this.availableBalance(account));
  }

  async executeTransaction(tx: Transaction, keyPair?: KeyPair): Promise<TransactionResult> {
    const account: nearAPI.Account = new nearAPI.Account(this.connection, tx.senderId);
    let oldKey: KeyPair | null = null;
    if (keyPair) {
      oldKey = await this.getKey(account.accountId);
      await this.setKey(account.accountId, keyPair);
    }

    try {
      const start = Date.now();
      // @ts-expect-error access shouldn't be protected
      const outcome: FinalExecutionOutcome = await account.signAndSendTransaction({receiverId: tx.receiverId, actions: tx.actions, returnError: false});
      const end = Date.now();
      if (oldKey) {
        await this.setKey(account.accountId, oldKey);
      } else if (keyPair) {
        // Sender account should only have account while execution transaction
        await this.deleteKey(tx.senderId);
      }

      const result = new TransactionResult(outcome, start, end, this.config);
      txDebug(result.summary());
      return result;
    } catch (error: unknown) {
      // Add back oldKey if temporary one was used
      if (oldKey) {
        await this.setKey(account.accountId, oldKey);
      }

      if (error instanceof Error) {
        const key = await this.getPublicKey(tx.receiverId);
        debug(`TX FAILED: receiver ${tx.receiverId} with key ${key?.toString() ?? 'MISSING'} ${JSON.stringify(tx.actions).slice(0, 1000)}`);
        debug(error);
      }

      throw error;
    }
  }

  addAccountCreated(account: string, _sender: string): void {
    this.accountsCreated.add(account);
  }

  async cleanup(): Promise<void> {} // eslint-disable-line @typescript-eslint/no-empty-function

  get rootAccountId(): string {
    return this.config.rootAccount!;
  }

  abstract get DEFAULT_INITIAL_BALANCE(): string;
  abstract createFrom(config: Config): Promise<NearAccountManager>;
  abstract get defaultKeyStore(): KeyStore;

  protected get keyStore(): KeyStore {
    return this.config.keyStore ?? this.defaultKeyStore;
  }

  protected get signer(): nearAPI.InMemorySigner {
    return new nearAPI.InMemorySigner(this.keyStore);
  }

  protected get networkId(): string {
    return this.config.network;
  }

  protected get connection(): nearAPI.Connection {
    return new nearAPI.Connection(this.networkId, this.provider, this.signer);
  }
}

export class TestnetManager extends AccountManager {
  static readonly KEYSTORE_PATH: string = path.join(process.cwd(), '.near-credentials', 'runner');
  private static numRootAccounts = 0;
  private static numTestAccounts = 0;

  static get defaultKeyStore(): KeyStore {
    const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(
      this.KEYSTORE_PATH,
    );
    return keyStore;
  }

  get DEFAULT_INITIAL_BALANCE(): string {
    return NEAR.parse('10 N').toJSON();
  }

  get defaultKeyStore(): KeyStore {
    return TestnetManager.defaultKeyStore;
  }

  get urlAccountCreator(): nearAPI.accountCreator.UrlAccountCreator {
    return new nearAPI.accountCreator.UrlAccountCreator(
      {} as any, // ignored
      this.config.helperUrl!,
    );
  }

  async init(): Promise<AccountManager> {
    await this.createAndFundAccount();
    return this;
  }

  async createAccountWithHelper(accountId: string, keyPair: KeyPair): Promise<void> {
    await this.urlAccountCreator.createAccount(accountId, keyPair.getPublicKey());
  }

  async createAccount(accountId: string, keyPair?: KeyPair): Promise<NearAccount> {
    if (accountId.includes('.')) {
      await this.getParentAccount(accountId).createAccount(accountId, {keyPair});
      this.accountsCreated.delete(accountId);
    } else {
      await this.createAccountWithHelper(accountId, keyPair ?? await this.getRootKey());
      debug(`Created account ${accountId} with account creator`);
    }

    return this.getAccount(accountId);
  }

  async addFundsFromNetwork(accountId: string = this.rootAccountId): Promise<void> {
    const temporaryId = randomAccountId();
    try {
      const key = await this.getRootKey();
      const account = await this.createAccount(temporaryId, key);
      await account.delete(accountId, key);
    } catch (error: unknown) {
      if (error instanceof Error) {
        await this.removeKey(temporaryId);
      }

      throw error;
    }
  }

  async addFunds(accountId: string, amount: BN): Promise<void> {
    const parent = this.getParentAccount(accountId);
    if (parent.accountId === accountId) {
      return this.addFundsFromNetwork(accountId);
    }

    if (!(await this.canCoverBalance(parent, amount))) {
      await this.addFunds(parent.accountId, amount);
    }

    await parent.transfer(accountId, amount);
  }

  async createAndFundAccount(): Promise<void> {
    await this.initRootAccount();
    const accountId: string = this.rootAccountId;
    if (!(await this.exists(accountId))) {
      await this.createAccount(accountId);
      debug(`Added masterAccount ${
        accountId
      }
          https://explorer.testnet.near.org/accounts/${this.rootAccountId}`);
    }
  }

  async deleteAccounts(accounts: string[], beneficiaryId: string): Promise<void[]> {
    const keyPair = await this.getKey(this.rootAccountId) ?? undefined;
    return Promise.all(
      accounts.map(async accountId => {
        await this.deleteAccount(accountId, beneficiaryId, keyPair);
        await this.deleteKey(accountId);
      }),
    );
  }

  async initRootAccount(): Promise<void> {
    if (this.config.rootAccount !== undefined) {
      return;
    }

    const fileName = findCallerFile()[0];
    const p = path.parse(fileName);
    if (['.ts', '.js'].includes(p.ext)) {
      const hash: string = sanitize(hashPathBase64(fileName));
      const currentRootNumber = TestnetManager.numRootAccounts === 0 ? '' : `${TestnetManager.numRootAccounts}`;
      TestnetManager.numRootAccounts++;
      const name = `r${currentRootNumber}${hash.slice(0, 6)}`;

      const accounts = await findAccountsWithPrefix(name, this.keyStore, this.networkId);
      const accountId = accounts.shift()!;
      this.config.rootAccount = accountId;
      return;
    }

    throw new Error(
      `Bad filename name passed by callsites: ${fileName}`,
    );
  }

  async createFrom(config: Config): Promise<AccountManager> {
    const currentRunAccount = TestnetManager.numTestAccounts;
    const prefix = currentRunAccount === 0 ? '' : currentRunAccount;
    TestnetManager.numTestAccounts += 1;
    const newConfig = {...config, rootAccount: `t${prefix}.${config.rootAccount!}`};
    return (new TestnetManager(newConfig)).init();
  }

  async cleanup(): Promise<void> {
    return this.deleteAccounts([...this.accountsCreated.values()], this.rootAccountId) as unknown as void;
  }

  async executeTransaction(tx: Transaction, keyPair?: KeyPair): Promise<TransactionResult> {
    if (tx.accountCreated) {
      // Delete new account if it exists
      if (await this.exists(tx.receiverId)) {
        await this.deleteAccount(tx.receiverId, tx.senderId, await this.getKey(tx.senderId) ?? keyPair);
      }

      // Add root's key as a full access key to new account so that it can delete account if needed
      tx.addKey((await this.getPublicKey(tx.senderId))!);
    }

    const amount = tx.transferAmount;
    // Add funds to root account sender if needed.
    if (await this.needsFunds(tx.senderId, amount.ushln(4))
        // Check a second time to be sure.  This is a really bad solution.
        && !await this.canCoverBalance(tx.senderId, amount)) {
      await this.addFunds(tx.senderId, amount);
    }

    try {
      return await super.executeTransaction(tx, keyPair);
    } catch (error: unknown) {
      if (error instanceof ServerError && error.type === 'NotEnoughBalance'
         && this.isRootOrTLAccount(tx.senderId)) {
        console.log('trying again ' + tx.senderId);
        await this.addFunds(tx.senderId, amount);
        return this.executeTransaction(tx, keyPair);
      }

      throw error;
    }
  }

  async needsFunds(accountId: string, amount: BN): Promise<boolean> {
    return !amount.isZero() && this.isRootOrTLAccount(accountId)
    && (!await this.canCoverBalance(accountId, amount));
  }

  isRootOrTLAccount(accountId: string): boolean {
    return this.rootAccountId === accountId || isTopLevelAccount(accountId);
  }
}

export class SandboxManager extends AccountManager {
  async init(): Promise<AccountManager> {
    if (!await this.getKey(this.rootAccountId)) {
      await this.setKey(this.rootAccountId, await getKeyFromFile(this.keyFilePath));
    }

    return this;
  }

  async createFrom(config: Config): Promise<NearAccountManager> {
    return new SandboxManager(config);
  }

  get DEFAULT_INITIAL_BALANCE(): string {
    return NEAR.parse('200 N').toJSON();
  }

  get defaultKeyStore(): KeyStore {
    const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(
      this.config.homeDir,
    );
    return keyStore;
  }

  get keyFilePath(): string {
    return path.join(this.config.homeDir, 'validator_key.json');
  }
}

export class ManagedTransaction extends Transaction {
  private delete = false;
  constructor(private readonly manager: AccountManager, sender: NamedAccount | string, receiver: NamedAccount | string) {
    super(sender, receiver);
  }

  createAccount(): this {
    this.manager.addAccountCreated(this.receiverId, this.senderId);
    return super.createAccount();
  }

  deleteAccount(beneficiaryId: string): this {
    this.delete = true;
    return super.deleteAccount(beneficiaryId);
  }

  /**
   *
   * @param keyPair Temporary key to sign transaction
   * @returns
   */
  async signAndSend(keyPair?: KeyPair): Promise<TransactionResult> {
    const executionResult = await this.manager.executeTransaction(this, keyPair);
    if (executionResult.succeeded && this.delete) {
      await this.manager.deleteKey(this.receiverId);
    }

    return executionResult;
  }
}

