import {URL} from 'url';
import {Buffer} from 'buffer';
import BN from 'bn.js';
import * as borsh from 'borsh';
import {
  DEFAULT_FUNCTION_CALL_GAS,
  KeyPair,
  PublicKey,
  CodeResult,
  FinalExecutionOutcome} from '../types';
import {Transaction} from '../runtime/transaction';
import {AccountBalance, Args, NO_DEPOSIT} from '../runtime/types';
import {ContractState} from '../contract-state';
import {JSONRpc} from '../provider';
import {NearAccount} from './near-account';
import {NearAccountManager} from './near-account-manager';

export class Account implements NearAccount {
  constructor(
    private readonly _accountId: string,
    private readonly manager: NearAccountManager,
  ) {}

  async exists(): Promise<boolean> {
    return this.provider.accountExists(this.accountId);
  }

  protected get provider(): JSONRpc {
    return this.manager.provider;
  }

  get accountId(): string {
    return this._accountId;
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
    {keyPair, initialBalance}: {keyPair?: KeyPair; initialBalance?: string} = {},
  ): Promise<NearAccount> {
    const tx = await this.internalCreateAccount(accountId, {keyPair, initialBalance});
    await tx.signAndSend();
    return this.getAccount(accountId);
  }

  /** Adds suffix to accountId if account isn't sub account or have full including top level account */
  getAccount(accountId: string): NearAccount {
    const id = this.makeSubAccount(accountId);
    return new Account(id, this.manager);
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
    }: {
      args?: Record<string, unknown> | Uint8Array;
      attachedDeposit?: string | BN;
      gas?: string | BN;
      initialBalance?: BN | string;
      keyPair?: KeyPair;
      method?: string;
    } = {},
  ): Promise<NearAccount> {
    let tx = (await this.internalCreateAccount(accountId, {keyPair, initialBalance}));
    tx = await tx.deployContractFile(wasm);
    if (method) {
      tx.functionCall(method, args, {gas, attachedDeposit});
    }

    await tx.signAndSend();
    return this.getAccount(accountId);
  }

  /**
   * Call a NEAR contract and return full results with raw receipts, etc. Example:
   *
   *     await call('lol.testnet', 'set_status', { message: 'hello' }, new BN(30 * 10**12), '0')
   *
   * @returns nearAPI.providers.FinalExecutionOutcome
   */
  async call_raw(
    contractId: NearAccount | string,
    methodName: string,
    args: Record<string, unknown>,
    {
      gas = DEFAULT_FUNCTION_CALL_GAS,
      attachedDeposit = NO_DEPOSIT,
      signWithKey = undefined,
    }: {
      gas?: string | BN;
      attachedDeposit?: string | BN;
      signWithKey?: KeyPair;
    } = {},
  ): Promise<FinalExecutionOutcome> {
    return this.createTransaction(contractId)
      .functionCall(methodName, args, {gas, attachedDeposit})
      .signAndSend(signWithKey);
  }

  /**
   * Convenient wrapper around lower-level `call_raw` that returns only successful result of call, or throws error encountered during call.  Example:
   *
   *     await call('lol.testnet', 'set_status', { message: 'hello' }, new BN(30 * 10**12), '0')
   *
   * @returns any parsed return value, or throws with an error if call failed
   */
  async call(
    contractId: NearAccount | string,
    methodName: string,
    args: Record<string, unknown>,
    {
      gas = DEFAULT_FUNCTION_CALL_GAS,
      attachedDeposit = NO_DEPOSIT,
      signWithKey = undefined,
    }: {
      gas?: string | BN;
      attachedDeposit?: string | BN;
      signWithKey?: KeyPair;
    } = {},
  ): Promise<any> {
    const txResult = await this.call_raw(
      contractId,
      methodName,
      args,
      {
        gas,
        attachedDeposit,
        signWithKey,
      },
    );
    if (typeof txResult.status === 'object' && typeof txResult.status.SuccessValue === 'string') {
      const value = Buffer.from(txResult.status.SuccessValue, 'base64').toString();
      try {
        return JSON.parse(value); // eslint-disable-line @typescript-eslint/no-unsafe-return
      } catch {
        return value;
      }
    }

    throw new Error(JSON.stringify(txResult.status));
  }

  async view_raw(method: string, args: Args = {}): Promise<CodeResult> {
    return this.provider.view_call(this.accountId, method, args);
  }

  async view(method: string, args: Args = {}): Promise<any> {
    const result = await this.view_raw(method, args);
    if (result.result) {
      return JSON.parse(Buffer.from(result.result).toString()); // eslint-disable-line @typescript-eslint/no-unsafe-return
    }

    return result.result;
  }

  async viewState(prefix: string | Uint8Array = ''): Promise<ContractState> {
    return new ContractState(await this.provider.viewState(this.accountId, prefix));
  }

  async patchState(key: string, value_: any, borshSchema?: any): Promise<any> {
    const data_key = Buffer.from(key).toString('base64');
    let value = (borshSchema) ? borsh.serialize(borshSchema, value_) : value_; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
    value = Buffer.from(value).toString('base64');
    const account_id = this.accountId;
    return this.provider.sandbox_patch_state({
      records: [
        {
          Data: {
            account_id,
            data_key,
            value, // eslint-disable-line @typescript-eslint/no-unsafe-assignment
          },
        },
      ]});
  }

  /** Delete account and sends funds to beneficiaryId */
  async delete(beneficiaryId: string): Promise<FinalExecutionOutcome> {
    return this.createTransaction(this).deleteAccount(beneficiaryId).signAndSend();
  }

  makeSubAccount(accountId: string): string {
    if (this.subAccountOf(accountId) || this.manager.root.subAccountOf(accountId)) {
      return accountId;
    }

    return `${accountId}.${this.accountId}`;
  }

  subAccountOf(accountId: string): boolean {
    return accountId.endsWith(`.${this.accountId}`);
  }

  toJSON(): string {
    return this.accountId;
  }

  protected async internalCreateAccount(accountId: string, {keyPair, initialBalance}: {keyPair?: KeyPair; initialBalance?: string | BN} = {}): Promise<Transaction> {
    const newAccountId = this.makeSubAccount(accountId);
    const pubKey = (await this.manager.setKey(newAccountId, keyPair)).getPublicKey();
    const amount = new BN(initialBalance ?? this.manager.initialBalance);
    return this.createTransaction(newAccountId).createAccount().transfer(amount).addKey(pubKey);
  }
}

