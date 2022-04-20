import {URL} from 'url';
import {Buffer} from 'buffer';
import BN from 'bn.js';
import {NEAR} from 'near-units';
import * as borsh from 'borsh';
import {
  DEFAULT_FUNCTION_CALL_GAS,
  KeyPair,
  PublicKey,
  CodeResult,
  AccountBalance,
  Args,
  AccountView,
  Empty,
  StateItem,
} from '../types';
import {Transaction} from '../transaction';
import {ContractState} from '../contract-state';
import {JsonRpcProvider} from '../jsonrpc';
import {EMPTY_CONTRACT_HASH, NO_DEPOSIT} from '../utils';
import {TransactionResult, TransactionError} from '../transaction-result';
import {AccessKeyData, AccountBuilder, AccountData, RecordBuilder, Records} from '../record';
import {NearAccount} from './near-account';
import {NearAccountManager} from './near-account-manager';

export class Account implements NearAccount {
  constructor(
    private readonly _accountId: string,
    private readonly manager: NearAccountManager,
  ) {}

  async accountView(): Promise<AccountView> {
    return this.manager.accountView(this._accountId);
  }

  async exists(): Promise<boolean> {
    return this.provider.accountExists(this.accountId);
  }

  protected get provider(): JsonRpcProvider {
    return this.manager.provider;
  }

  get accountId(): string {
    return this._accountId;
  }

  async availableBalance(): Promise<NEAR> {
    return this.manager.availableBalance(this.accountId);
  }

  async balance(): Promise<AccountBalance> {
    return this.manager.balance(this.accountId);
  }

  createTransaction(receiver: NearAccount | string): Transaction {
    return this.manager.createTransaction(this, receiver);
  }

  async getKey(): Promise<KeyPair | null> {
    return this.manager.getKey(this.accountId);
  }

  async setKey(keyPair?: KeyPair): Promise<PublicKey> {
    return (await this.manager.setKey(this.accountId, keyPair)).getPublicKey();
  }

  async createAccount(
    accountId: string,
    {
      keyPair,
      initialBalance,
    }: {keyPair?: KeyPair; initialBalance?: string; isSubAccount?: boolean} = {},
  ): Promise<NearAccount> {
    const tx = await this.internalCreateAccount(accountId, {
      keyPair,
      initialBalance,
      isSubAccount: false,
    });
    await tx.transact();
    return this.getAccount(accountId);
  }

  async createSubAccount(
    accountId: string,
    {
      keyPair,
      initialBalance,
    }: {keyPair?: KeyPair; initialBalance?: string; isSubAccount?: boolean} = {},
  ): Promise<NearAccount> {
    const tx = await this.internalCreateAccount(accountId, {
      keyPair,
      initialBalance,
      isSubAccount: true,
    });
    await tx.transact();
    return this.getSubAccount(accountId);
  }

  async createAccountFrom({
    testnetContract,
    mainnetContract,
    withData = false,
    block_id,
    keyPair,
    initialBalance,
  }: {
    testnetContract?: string;
    mainnetContract?: string;
    withData?: boolean;
    keyPair?: KeyPair;
    initialBalance?: string;
    block_id?: number | string;
  }): Promise<NearAccount> {
    if ((testnetContract && mainnetContract) || !(testnetContract || mainnetContract)) {
      throw new TypeError('Provide `mainnetContract` or `testnetContract` but not both.');
    }

    const network = mainnetContract ? 'mainnet' : 'testnet';
    const refContract = (mainnetContract ?? testnetContract)!;

    const rpc = JsonRpcProvider.fromNetwork(network);
    const blockQuery = block_id ? {block_id} : undefined;
    const account = this.getAccount(refContract) as Account;

    // Get account view of account on reference network
    const accountView = await rpc.viewAccount(refContract, blockQuery);
    accountView.amount = initialBalance ?? accountView.amount;
    const pubKey = await account.setKey(keyPair);
    const records = account.recordBuilder()
      .account(accountView)
      .accessKey(pubKey);

    if (accountView.code_hash !== EMPTY_CONTRACT_HASH) {
      const binary = await rpc.viewCodeRaw(refContract, blockQuery);
      records.contract(binary);
    }

    await account.sandbox_patch_state(records);

    if (!await this.provider.accountExists(refContract)) {
      await account.sandbox_patch_state(records);
      if (!await this.provider.accountExists(refContract)) {
        throw new Error(`Account ${refContract} does not exist after trying to patch into sandbox.`);
      }
    }

    if (withData) {
      const rawData = await rpc.viewStateRaw(account.accountId, '', blockQuery);
      const data = rawData.map(({key, value}) => ({
        Data: {
          account_id: account.accountId, data_key: key, value,
        },
      }));
      await account.sandbox_patch_state({records: data});
    }

    return account;
  }

  getSubAccount(accountId: string): NearAccount {
    const id = this.makeSubAccount(accountId);
    return this.getAccount(id);
  }

  getAccount(accountId: string): NearAccount {
    return new Account(accountId, this.manager);
  }

  async createAndDeploy(
    accountId: string,
    wasm: string | URL | Uint8Array | Buffer,
    {
      attachedDeposit = NO_DEPOSIT,
      args = {},
      gas = DEFAULT_FUNCTION_CALL_GAS,
      initialBalance,
      keyPair,
      method,
      isSubAccount,
    }: {
      args?: Record<string, unknown> | Uint8Array;
      attachedDeposit?: string | BN;
      gas?: string | BN;
      initialBalance?: BN | string;
      keyPair?: KeyPair;
      method?: string;
      isSubAccount?: boolean;
    } = {},
  ): Promise<NearAccount> {
    let tx = await this.internalCreateAccount(accountId, {
      keyPair,
      initialBalance,
      isSubAccount,
    });
    tx = await tx.deployContractFile(wasm);
    if (method) {
      tx.functionCall(method, args, {gas, attachedDeposit});
    }

    await tx.transact();
    return this.getAccount(accountId);
  }

  async call_raw(
    contractId: NearAccount | string,
    methodName: string,
    args: Record<string, unknown> | Uint8Array,
    {
      gas = DEFAULT_FUNCTION_CALL_GAS,
      attachedDeposit = NO_DEPOSIT,
      signWithKey = undefined,
    }: {
      gas?: string | BN;
      attachedDeposit?: string | BN;
      signWithKey?: KeyPair;
    } = {},
  ): Promise<TransactionResult> {
    return this.createTransaction(contractId)
      .functionCall(methodName, args, {gas, attachedDeposit})
      .transact(signWithKey);
  }

  async call<T>(
    contractId: NearAccount | string,
    methodName: string,
    args: Record<string, unknown> | Uint8Array,
    {
      gas = DEFAULT_FUNCTION_CALL_GAS,
      attachedDeposit = NO_DEPOSIT,
      signWithKey = undefined,
    }: {
      gas?: string | BN;
      attachedDeposit?: string | BN;
      signWithKey?: KeyPair;
    } = {},
  ): Promise<T> {
    const txResult = await this.call_raw(contractId, methodName, args, {
      gas,
      attachedDeposit,
      signWithKey,
    });
    if (txResult.failed) {
      throw new TransactionError(txResult);
    }

    return txResult.parseResult<T>();
  }

  async view_raw(method: string, args: Args = {}): Promise<CodeResult> {
    return this.provider.view_call(this.accountId, method, args);
  }

  async view<T>(method: string, args: Args = {}): Promise<T> {
    const result = await this.view_raw(method, args);
    if (result.result) {
      const value = Buffer.from(result.result).toString();
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    }

    return null as unknown as T;
  }

  async viewCode(): Promise<Buffer> {
    return this.provider.viewCode(this.accountId);
  }

  async viewCodeRaw(): Promise<string> {
    return this.provider.viewCodeRaw(this.accountId);
  }

  async viewState(prefix: string | Uint8Array = ''): Promise<ContractState> {
    return new ContractState(
      await this.provider.viewState(this.accountId, prefix),
    );
  }

  async viewStateRaw(prefix: string | Uint8Array = ''): Promise<StateItem[]> {
    return this.provider.viewStateRaw(this.accountId, prefix);
  }

  async patchState(key: string, value_: any, borshSchema?: any): Promise<Empty> {
    return this.updateData(Buffer.from(key), Buffer.from(borshSchema ? borsh.serialize(borshSchema, value_) : value_));
  }

  async sandbox_patch_state(records: Records): Promise<Empty> {
    // FIX THIS: Shouldn't need two calls to update before next RPC view call.
    await this.provider.sandbox_patch_state(records);
    return this.provider.sandbox_patch_state(records);
  }

  async delete(beneficiaryId: string, keyPair?: KeyPair): Promise<TransactionResult> {
    const result = await this.createTransaction(this)
      .deleteAccount(beneficiaryId)
      .transact(keyPair);
    if (result.succeeded && await this.getKey() !== null) {
      await this.manager.deleteKey(this.accountId);
    }

    return result;
  }

  makeSubAccount(accountId: string): string {
    return `${accountId}.${this.accountId}`;
  }

  subAccountOf(accountId: string): boolean {
    return accountId.endsWith(`.${this.accountId}`);
  }

  toJSON(): string {
    return this.accountId;
  }

  async updateAccount(accountData?: Partial<AccountData>): Promise<Empty> {
    return this.sandbox_patch_state(this.recordBuilder().account(accountData));
  }

  async updateAccessKey(key: string | PublicKey | KeyPair, access_key_data?: AccessKeyData): Promise<Empty> {
    return this.sandbox_patch_state(this.recordBuilder().accessKey(key, access_key_data));
  }

  async updateContract(binary: Buffer | string): Promise<Empty> {
    const accountView = await this.accountView();
    const rb = this.recordBuilder();
    rb.account(accountView);
    return this.sandbox_patch_state(rb.contract(binary));
  }

  async updateData(key: string | Buffer, value: string | Buffer): Promise<Empty> {
    const key_string = key instanceof Buffer ? key.toString('base64') : key;
    const value_string = value instanceof Buffer ? value.toString('base64') : value;
    return this.sandbox_patch_state(this.recordBuilder().data(key_string, value_string));
  }

  async transfer(accountId: string | NearAccount, amount: string | BN): Promise<TransactionResult> {
    return this.createTransaction(accountId).transfer(amount).transact();
  }

  protected async internalCreateAccount(
    accountId: string,
    {
      keyPair,
      initialBalance,
      isSubAccount,
    }: {keyPair?: KeyPair; initialBalance?: string | BN; isSubAccount?: boolean} = {},
  ): Promise<Transaction> {
    const newAccountId = isSubAccount ? this.makeSubAccount(accountId) : accountId;
    const pubKey = (await this.getOrCreateKey(newAccountId, keyPair)).getPublicKey();
    const amount = (initialBalance ?? this.manager.initialBalance).toString();
    return this.createTransaction(newAccountId)
      .createAccount()
      .transfer(amount)
      .addKey(pubKey);
  }

  private async getOrCreateKey(accountId: string, keyPair?: KeyPair): Promise<KeyPair> {
    return (await this.manager.getKey(accountId)) ?? this.manager.setKey(accountId, keyPair);
  }

  private recordBuilder(): AccountBuilder {
    return RecordBuilder.fromAccount(this);
  }
}

