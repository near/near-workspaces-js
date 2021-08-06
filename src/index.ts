import { join } from "path";
import { promises as fs } from "fs";

import BN from "bn.js";
import * as nearAPI from "near-api-js";
import * as borsh from "borsh";
// import { CodeResult } from "near-api-js/src/providers/provider"


import { debug } from "./utils";
import { Config, SandboxServer } from "./server";

export class SandboxRuntime {
  private static networkId = "sandbox";
  private static rootAccountName = "test.near";
  private static readonly INITIAL_DEPOSIT = new BN(10).pow(new BN(25));
  private near: nearAPI.Near;
  private root: Account;
  private masterKey: nearAPI.KeyPair;

  private constructor(
    near: nearAPI.Near,
    root: nearAPI.Account,
    masterKey: nearAPI.KeyPair,
    public homeDir: string,
  ) {
    this.near = near;
    this.root = new Account(root);
    this.masterKey = masterKey;
  }

  get pubKey(): nearAPI.utils.key_pair.PublicKey {
    return this.masterKey.getPublicKey();
  }

  static async connect(
    rpcAddr: string,
    homeDir: string,
    init?: boolean
  ): Promise<SandboxRuntime> {
    const keyFile = require(join(homeDir, "validator_key.json"));
    const masterKey = nearAPI.utils.KeyPair.fromString(
      keyFile.secret_key || keyFile.private_key
    );
    const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(
      homeDir
    );
    if (init) {
      await keyStore.setKey(this.networkId, this.rootAccountName, masterKey);
    }
    const near = await nearAPI.connect({
      keyStore,
      networkId: this.networkId,
      nodeUrl: rpcAddr,
    });
    const root = new nearAPI.Account(near.connection, "test.near");
    const runtime = new SandboxRuntime(near, root, masterKey, homeDir);
    return runtime;
  }

  async createAccount(name: string): Promise<Account> {
    const pubKey = await this.near.connection.signer.createKey(
      name,
      SandboxRuntime.networkId
    );
    await this.root.najAccount.createAccount(
      name,
      pubKey,
      new BN(10).pow(new BN(25))
    );
    return this.getAccount(name);
  }

  async createAndDeploy(
    name: string,
    wasm: string,
    initialDeposit: BN = SandboxRuntime.INITIAL_DEPOSIT
  ): Promise<ContractAccount> {
    const pubKey = await this.near.connection.signer.createKey(
      name,
      SandboxRuntime.networkId
    );
    const najContractAccount =
      await this.root.najAccount.createAndDeployContract(
        name,
        pubKey,
        await fs.readFile(wasm),
        initialDeposit
      );
    return new ContractAccount(najContractAccount);
  }

  getRoot(): Account {
    return this.root;
  }

  getAccount(name: string): Account {
    return new Account(new nearAPI.Account(this.near.connection, name));
  }

  getContractAccount(name: string): ContractAccount {
    return new ContractAccount(new nearAPI.Account(this.near.connection, name));
  }
}

type Args = { [key: string]: any };

export class Account {
  najAccount: nearAPI.Account;

  constructor(account: nearAPI.Account) {
    this.najAccount = account;
  }

  get connection(): nearAPI.Connection {
    return this.najAccount.connection;
  }

  get accountId(): string {
    return this.najAccount.accountId;
  }

  get provider(): nearAPI.providers.JsonRpcProvider {
    return this.connection.provider as nearAPI.providers.JsonRpcProvider;
  }

  /**
   * Call a NEAR contract and return full results with raw receipts, etc. Example:
   *
   *     await call('lol.testnet', 'set_status', { message: 'hello' }, new BN(30 * 10**12), '0')
   *
   * @returns nearAPI.providers.FinalExecutionOutcome
   */
  async call_raw(
    contractId: string,
    methodName: string,
    args: object,
    gas: string | BN = new BN(25 * 10**12),
    attachedDeposit: string | BN = new BN('0'),
  ): Promise<any> {
    const txResult = await this.najAccount.functionCall({
      contractId,
      methodName,
      args,
      gas: new BN(gas),
      attachedDeposit: new BN(attachedDeposit),
    });
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
    contractId: string,
    methodName: string,
    args: object,
    gas: string | BN = new BN(30 * 10**12), // TODO: import DEFAULT_FUNCTION_CALL_GAS from NAJ
    attachedDeposit: string | BN = new BN('0'),
  ): Promise<any> {
    const txResult = await this.call_raw(
      contractId,
      methodName,
      args,
      gas,
      attachedDeposit,
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
}

export class ContractAccount extends Account {
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
    let value  = (borshSchema) ? borsh.serialize(borshSchema, val): val;
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
  constructor(dataArray: Array<{key: Buffer; value: Buffer;}>){
    this.data = new Map();
    dataArray.forEach(({key, value}) => {
      this.data.set(key.toString(), value);
    });
  }

  get_raw(key: string): Buffer {
    return this.data.get(key) || Buffer.from("");
  }

  get(key: string, borshSchema?: {type: any, schema: any}): any {
    const value = this.get_raw(key);
    if (borshSchema) {
      return borsh.deserialize(borshSchema.schema, borshSchema.type, value);
    }
    return value.toJSON();
  }

}

export type TestRunnerFn = (s: SandboxRuntime) => Promise<void>;

async function runFunction(
  f: TestRunnerFn,
  config?: Partial<Config>
): Promise<SandboxRuntime> {
  const server = await SandboxServer.init(config);
  try {
    await server.start(); // Wait until server is ready
    const runtime = await SandboxRuntime.connect(
      server.rpcAddr,
      server.homeDir,
      config?.init
    );
    await f(runtime);
    return runtime;
  } catch (e){
    console.error(e)
    throw e
  } finally {
    debug("Closing server with port " + server.port);
    server.close();
  }
}

export type SandboxRunner = (f: TestRunnerFn) => Promise<void>;

export async function createSandbox(
  setupFn: TestRunnerFn
): Promise<SandboxRunner> {
  const runtime = await runFunction(setupFn, { init: true });
  return async (testFn: TestRunnerFn) => {
    await runFunction(testFn, { refDir: runtime!.homeDir, init: false });
  };
}
