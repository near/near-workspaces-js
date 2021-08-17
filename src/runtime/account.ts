import BN from "bn.js";
import * as nearAPI from "near-api-js";
import {
  AccessKey,
  Action,
  addKey,
  createAccount,
  deleteAccount,
  deleteKey,
  deployContract,
  fullAccessKey,
  functionCall,
  KeyPair,
  PublicKey,
  stake,
  transfer,
} from "../types";
import * as borsh from "borsh";
import { FinalExecutionOutcome } from "../provider";
import { debug } from "./utils";
import { Runtime } from "./runtime";
import * as fs from "fs/promises";

type Args = { [key: string]: any };

// TODO: import DEFAULT_FUNCTION_CALL_GAS from NAJ
const DEFAULT_FUNCTION_CALL_GAS = new BN(30 * 10 ** 12);
const NO_DEPOSIT = new BN('0');

export interface CallOptions {
  gas?: string | BN;
  attachedDeposit?: string | BN;
  signWithKey?: KeyPair;
}

// TODO: expose in naj
export interface AccountBalance {
  total: string;
  stateStaked: string;
  staked: string;
  available: string;
}

export class Account {
  
  constructor(
    private readonly _accountId: string,
    private runtime: Runtime,
    private levelUp?: string,
  ) {}

  get najAccount(): nearAPI.Account {
    return new nearAPI.Account(this.runtime.near.connection, this.accountId)
  }

  get connection(): nearAPI.Connection {
    return this.najAccount.connection;
  }

  get networkId(): string { 
    return this.connection.networkId; 
  }

  get signer(): nearAPI.InMemorySigner {
    return this.connection.signer as nearAPI.InMemorySigner;
  }

  get keyStore(): nearAPI.keyStores.KeyStore {
    return this.signer.keyStore;
  }

  get accountId(): string {
    return this._accountId;
  }

  get prefix(): string {
    return this.levelUp ? this.accountId.replace(`.${this.levelUp}`, "") : this.accountId;
  }

  async balance(): Promise<AccountBalance> {
    return this.najAccount.getAccountBalance() as Promise<AccountBalance>;
  }

  createTransaction(receiver: Account | string): Transaction {
    return new RuntimeTransaction(this.runtime, this, receiver);
  }

  get provider(): nearAPI.providers.JsonRpcProvider {
    return this.connection.provider as nearAPI.providers.JsonRpcProvider;
  }

  async getKey(accountId: string): Promise<KeyPair> {
    return this.keyStore.getKey(this.networkId, this.makeSubAccount(accountId));
  }

  async setKey(accountId: string, keyPair: KeyPair): Promise<void> {
    await this.keyStore.setKey(this.networkId, this.makeSubAccount(accountId), keyPair);
  }

  protected async addKey(accountId: string, keyPair?: KeyPair): Promise<PublicKey> {
    const id = this.makeSubAccount(accountId);
    let pubKey: PublicKey;
    if (keyPair) {
      const key = await nearAPI.InMemorySigner.fromKeyPair(
        this.networkId,
        id,
        keyPair
      );
      pubKey = await key.getPublicKey();
    } else {
      pubKey = await this.signer.createKey(id, this.networkId);
    }
    return pubKey;
  }

  async createAccount(
    accountId: string,
    { keyPair, initialBalance = this.runtime.config.initialBalance! }: { keyPair?: KeyPair; initialBalance?: string } = {}
  ): Promise<Account> {
    const tx = await this.internalCreateAccount(accountId, {keyPair, initialBalance});
    await tx.signAndSend();
    return this.getAccount(accountId);
  }

  protected async internalCreateAccount(accountId: string,  {keyPair, initialBalance }: { keyPair?: KeyPair; initialBalance?: string | BN } = {}): Promise<Transaction> {
    let newAccountId = this.makeSubAccount(accountId);
    const pubKey = await this.addKey(newAccountId, keyPair); 
    const amount = new BN(initialBalance || this.runtime.config.initialBalance!);
    return this.createTransaction(newAccountId).createAccount().transfer(amount).addKey(pubKey);
  }

  /** Adds suffix to accountId if account isn't sub account or have full including top level account */
  getAccount(accountId: string): Account {
    const id = this.makeSubAccount(accountId);
    return new Account(id, this.runtime);
  }

  async createAndDeploy(
    accountId: string,
    wasm: Uint8Array | string,
    {
      attachedDeposit = NO_DEPOSIT,
      args = {},
      gas = DEFAULT_FUNCTION_CALL_GAS,
      initialBalance,
      keyPair,
      method,
    }: {
      args?: object | Uint8Array;
      attachedDeposit?: string | BN;
      gas?: string | BN;
      initialBalance?: BN | string;
      keyPair?: KeyPair;
      method?: string;
    } = {}
  ): Promise<Account> {
     let tx = (await this.internalCreateAccount(accountId, {keyPair, initialBalance}))
     tx = await tx.deployContractFile(wasm);
     if (method) {
       tx.functionCall(method, args, { gas, attachedDeposit });
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
    contractId: Account | string,
    methodName: string,
    args: object,
    {
      gas = DEFAULT_FUNCTION_CALL_GAS,
      attachedDeposit = NO_DEPOSIT,
      signWithKey = undefined,
    }: {
      gas?: string | BN;
      attachedDeposit?: string | BN;
      signWithKey?: KeyPair;
    } = {}
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
    contractId: Account | string,
    methodName: string,
    args: object,
    {
      gas = DEFAULT_FUNCTION_CALL_GAS,
      attachedDeposit = NO_DEPOSIT,
      signWithKey = undefined,
    }:{
      gas?: string | BN;
      attachedDeposit?: string | BN;
      signWithKey?: KeyPair
    } = {}
  ): Promise<any> {
    const txResult = await this.call_raw(
      contractId,
      methodName,
      args,
      {
        gas,
        attachedDeposit,
        signWithKey
      }
    );
    if (typeof txResult.status === 'object' && typeof txResult.status.SuccessValue === 'string') {
      const value = Buffer.from(txResult.status.SuccessValue, 'base64').toString();
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    throw JSON.stringify(txResult.status);
  }

  async view_raw(method: string, args: Args = {}): Promise<any> {
    const res: any = await this.connection.provider.query({
      request_type: 'call_function',
      account_id: this.accountId,
      method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
      finality: 'optimistic'
    });
    return res;
  }

  async view(method: string, args: Args = {}): Promise<any> {
    const res = await this.view_raw(method, args);
    if (res.result) {
      return JSON.parse(Buffer.from(res.result).toString())
    }
    return res.result;
  }

  async viewState(): Promise<ContractState> {
    return new ContractState(await this.najAccount.viewState(""));
  }

  async patchState(key: string, val: any, borshSchema?: any): Promise<any> {
    const data_key = Buffer.from(key).toString('base64');
    let value = (borshSchema) ? borsh.serialize(borshSchema, val) : val;
    value = Buffer.from(value).toString('base64');
    const account_id = this.accountId;
    return this.provider.sendJsonRpc("sandbox_patch_state", {
      records: [
        {
          "Data": {
            account_id,
            data_key,
            value
          }
        }
      ]});
    }

  makeSubAccount(accountId: string): string {
    if (this.subAccountOf(accountId) || this.runtime.getRoot().subAccountOf(accountId)) return accountId
    return `${accountId}.${this.accountId}`;
  }

  subAccountOf(accountId: string): boolean {
    return accountId.endsWith(`.${this.accountId}`);
  }
}
export class ContractState {
  private data: Map<string, Buffer>;
  constructor(dataArray: Array<{ key: Buffer; value: Buffer; }>) {
    this.data = new Map();
    dataArray.forEach(({ key, value }) => {
      this.data.set(key.toString(), value);
    });
  }

  get_raw(key: string): Buffer {
    return this.data.get(key) || Buffer.from("");
  }

  get(key: string, borshSchema?: { type: any, schema: any }): any {
    const value = this.get_raw(key);
    if (borshSchema) {
      return borsh.deserialize(borshSchema.schema, borshSchema.type, value);
    }
    return value.toJSON();
  }
}

export class Transaction {
  private actions: Action[] = [];
  protected receiverId: string;
  constructor(protected sender: Account, receiver: Account | string) {
    this.receiverId =
      typeof receiver === "string" ? receiver : receiver.accountId;
  }

  addKey(publicKey: string | PublicKey, accessKey: AccessKey = fullAccessKey()): Transaction {
    this.actions.push(addKey(PublicKey.from(publicKey), accessKey));
    return this;
  }

  createAccount(): Transaction {
    this.actions.push(createAccount());
    return this;
  }

  deleteAccount(beneficiaryId: string): Transaction {
    this.actions.push(deleteAccount(beneficiaryId));
    return this;
  }

  deleteKey(publicKey: string | PublicKey): Transaction {
    this.actions.push(deleteKey(PublicKey.from(publicKey)));
    return this;
  }

  async deployContractFile(code: string | Buffer | Uint8Array): Promise<Transaction> {
    return this.deployContract(typeof code === 'string' ? await fs.readFile(code) : code);
  }

  deployContract(code: Uint8Array): Transaction {
    this.actions.push(deployContract(code));
    return this;
  }

  functionCall(
    methodName: string,
    args: object | Uint8Array,
    {
      gas = DEFAULT_FUNCTION_CALL_GAS,
      attachedDeposit = NO_DEPOSIT,
    }: { gas: BN | string; attachedDeposit: BN | string }
  ): Transaction {
    this.actions.push(
      functionCall(methodName, args, new BN(gas), new BN(attachedDeposit))
    );
    return this;
  }

  stake(amount: BN | string, publicKey: PublicKey | string): Transaction {
    this.actions.push(stake(new BN(amount), PublicKey.from(publicKey)));
    return this;
  }

  transfer(amount: string | BN): Transaction {
    this.actions.push(transfer(new BN(amount)));
    return this;
  }

  // TODO: expose signAndSend in naj
  /**
   * 
   * @param keyPair Temporary key to sign transaction
   * @returns 
   */
  async signAndSend(keyPair?: KeyPair): Promise<FinalExecutionOutcome> {
    let oldKey: KeyPair;
    if (keyPair) {
      oldKey = await this.sender.getKey(this.sender.accountId);
      await this.sender.setKey(this.sender.accountId, keyPair);
    }
    // @ts-expect-error
    const res = await this.sender.najAccount.signAndSendTransaction({
      receiverId: this.receiverId,
      actions: this.actions,
    });
    if (keyPair) {
      await this.sender.setKey(this.sender.accountId, oldKey!);
    }
    return res;
  }
}

export class RuntimeTransaction extends Transaction {

  constructor(private runtime: Runtime, sender:Account, receiver: Account | string){
    super(sender, receiver);
  }

  createAccount(): Transaction {
    this.runtime.addAccountCreated(this.receiverId, this.sender)
    return super.createAccount();
  }

  async signAndSend(keyPair?: KeyPair): Promise<FinalExecutionOutcome> {
    return this.runtime.executeTransaction(async () => super.signAndSend(keyPair));
  }
}