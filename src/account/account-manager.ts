import * as path from 'path';
import * as os from 'os';
import * as nearAPI from 'near-api-js';
import {asId, randomAccountId, toYocto} from '../utils';
import {KeyPair, BN, KeyPairEd25519, FinalExecutionOutcome, KeyStore, AccountBalance, NamedAccount} from '../types';
import {debug} from '../internal-utils';
import {Transaction} from '../transaction';
import {JSONRpc} from '../jsonrpc';
import {Config} from '../interfaces';
import {ExecutionResult} from '../execution-result';
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
  debug(`Looking for ${prefix} in:\n  ${accounts.join('\n  ')}`);
  const paths = accounts.filter(f => f.startsWith(prefix));
  debug(`Found:\n  ${paths.join('\n  ')}`);
  if (paths.length > 0) {
    return paths;
  }

  return [timeSuffix(prefix, 9_999_999)];
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

  getAccount(accountId: string): NearAccount {
    return new Account(accountId, this);
  }

  getParentAccount(accountId: string): NearAccount {
    return this.getAccount(accountId.split('.').slice(1).join('.'));
  }

  async deleteKey(
    account_id: string,
  ): Promise<void> {
    debug(`About to delete key for ${account_id}`);
    await this.keyStore.removeKey(this.networkId, account_id);
    debug('deleted Key');
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

  get provider(): JSONRpc {
    return JSONRpc.from(this.config);
  }

  createTransaction(sender: NearAccount | string, receiver: NearAccount | string): Transaction {
    return new ManagedTransaction(this, sender, receiver);
  }

  async getKey(accountId: string): Promise<KeyPair | null> {
    return this.keyStore.getKey(this.networkId, accountId);
  }

  /** Sets the provided key to store, otherwise creates a new one */
  async setKey(accountId: string, keyPair?: KeyPair): Promise<KeyPair> {
    const key = keyPair ?? KeyPairEd25519.fromRandom();
    await this.keyStore.setKey(this.networkId, accountId, key);
    debug(`setting keys for ${accountId}`);
    return (await this.getKey(accountId))!;
  }

  async removeKey(accountId: string): Promise<void> {
    await this.keyStore.removeKey(this.networkId, accountId);
  }

  async deleteAccount(accountId: string, beneficiaryId: string): Promise<void> {
    await this.getAccount(accountId).delete(beneficiaryId);
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

  async exists(accountId: string | NearAccount): Promise<boolean> {
    return this.provider.accountExists(asId(accountId));
  }

  async executeTransaction(tx: Transaction, keyPair?: KeyPair): Promise<ExecutionResult> {
    const account: nearAPI.Account = new nearAPI.Account(this.connection, tx.senderId);
    let oldKey: KeyPair | null = null;
    if (keyPair) {
      oldKey = await this.getKey(account.accountId);
      await this.setKey(account.accountId, keyPair);
    }

    const start = Date.now();
    // @ts-expect-error access shouldn't be protected
    const outcome: FinalExecutionOutcome = await account.signAndSendTransaction({receiverId: tx.receiverId, actions: tx.actions});
    const end = Date.now();
    if (oldKey) {
      await this.setKey(account.accountId, oldKey);
    }

    const result = new ExecutionResult(outcome, start, end);
    console.log(result.summary());
    return result;
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
  static readonly KEYSTORE_PATH: string = path.join(os.homedir(), '.near-credentials', 'near-runner');
  static readonly KEY_DIR_PATH: string = path.join(TestnetManager.KEYSTORE_PATH, 'testnet');
  private static numRootAccounts = 0;
  private static numTestAccounts = 0;

  static get defaultKeyStore(): KeyStore {
    const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(
      this.KEYSTORE_PATH,
    );
    return keyStore;
  }

  get DEFAULT_INITIAL_BALANCE(): string {
    return toYocto('10');
  }

  get defaultKeyStore(): KeyStore {
    return TestnetManager.defaultKeyStore;
  }

  async init(): Promise<AccountManager> {
    await this.createAndFundAccount();
    return this;
  }

  async createAccount(accountId: string, keyPair: KeyPair): Promise<NearAccount> {
    if (accountId.includes('.')) {
      await this.getParentAccount(accountId).createAccount(accountId, {keyPair});
      this.accountsCreated.delete(accountId);
    } else {
      const accountCreator = new nearAPI.accountCreator.UrlAccountCreator(
        {} as any, // ignored
        this.config.helperUrl!,
      );
      await accountCreator.createAccount(accountId, keyPair.getPublicKey());
    }

    return this.getAccount(accountId);
  }

  async addFunds(): Promise<void> {
    const temporaryId = randomAccountId();
    debug(`adding funds to ${this.rootAccountId} using ${temporaryId}`);
    const keyPair = await this.getRootKey();
    const {keyStore} = this;
    await keyStore.setKey(this.networkId, temporaryId, keyPair);
    const account = await this.createAccount(temporaryId, keyPair);
    await account.delete(this.rootAccountId);
  }

  async createAndFundAccount(): Promise<void> {
    await this.initRootAccount();
    const accountId: string = this.rootAccountId;
    if (!(await this.provider.accountExists(accountId))) {
      const keyPair = await this.getRootKey();
      const {keyStore} = this;
      await keyStore.setKey(this.networkId, accountId, keyPair);
      await this.createAccount(accountId, keyPair);
      debug(`Added masterAccount ${
        accountId
      }
          https://explorer.testnet.near.org/accounts/${this.rootAccountId}`);
    }

    if (new BN((await this.root.balance()).available).lt(new BN(toYocto('499')))) {
      await this.addFunds();
    }
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
      await Promise.all(
        accounts.map(async acc => {
          await this.deleteAccount(acc, accountId);
        }),
      );
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
    await Promise.all(
      [...this.accountsCreated.values()]
        .map(async id => this.getAccount(id).delete(this.rootAccountId)),
    );
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
    return toYocto('200');
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
  async signAndSend(keyPair?: KeyPair): Promise<ExecutionResult> {
    const executionResult = await this.manager.executeTransaction(this, keyPair);
    if (executionResult.succeeded && this.delete) {
      await this.manager.deleteKey(this.receiverId);
    }

    return executionResult;
  }
}

