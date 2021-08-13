import BN from "bn.js";
import * as nearAPI from "near-api-js";
import { KeyPair } from "../types";
import * as borsh from "borsh";

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
    public najAccount: nearAPI.Account
  ) {}

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
    return this.najAccount.accountId;
  }

  async balance(): Promise<AccountBalance> {
    return this.najAccount.getAccountBalance() as Promise<AccountBalance>;
  }

  get provider(): nearAPI.providers.JsonRpcProvider {
    return this.connection.provider as nearAPI.providers.JsonRpcProvider;
  }

  async getKey(accountId: string): Promise<KeyPair> {
    return this.keyStore.getKey(this.networkId, accountId);
  }

  async setKey(accountId: string, keyPair: KeyPair): Promise<void> {
    await this.keyStore.setKey(this.networkId, accountId, keyPair);
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
      signWithKey?: KeyPair
    } = {}
  ): Promise<any> {
    const accountId = typeof contractId === "string" ? contractId : contractId.accountId;
    let oldKey: KeyPair;
    if (signWithKey) {
      oldKey = await this.getKey(accountId);
      await this.setKey(accountId, signWithKey);
    }
    const txResult = await this.najAccount.functionCall({
      contractId: accountId,
      methodName,
      args,
      gas: new BN(gas),
      attachedDeposit: new BN(attachedDeposit),
    });
    if (signWithKey) {
      await this.setKey(accountId, oldKey!);
    }
    return txResult;
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

  // async view_raw(method: string, args: Args = {}): Promise<CodeResult> {
  //   const res: CodeResult = await this.connection.provider.query({
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
      ]
    })
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
