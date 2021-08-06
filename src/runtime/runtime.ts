import { promises as fs } from "fs";
import BN from "bn.js";
import * as nearAPI from "near-api-js";
import { join } from "path";
import { Account, ContractAccount } from './account'
import { SandboxServer, getHomeDir } from './server';
import { debug } from '../utils';

export type TestRunnerFn = (s: Runtime) => Promise<void>;

export interface Config {
  homeDir: string;
  port: number;
  init: boolean;
  rm: boolean;
  refDir: string | null;
  network: 'sandbox' | 'testnet';
  rootAccountName: string;
  rpcAddr?: string;
}

export abstract class Runtime {
  static async create(config: Partial<Config>): Promise<Runtime> {
    if (config.network === 'testnet') {
      return new TestnetRuntime(config)
    }
    return new SandboxRuntime(config)
  }

  abstract get defaultConfig(): Config;
  abstract run(fn: TestRunnerFn): Promise<Runtime>;

  protected root?: Account;
  protected near?: nearAPI.Near;
  protected masterKey?: nearAPI.KeyPair;

  // TODO: should probably be protected
  config: Config;

  constructor(config: Partial<Config>) {
    this.config = this.getConfig(config);
  }

  private getConfig(config: Partial<Config>): Config {
    return {
      ...this.defaultConfig,
      ...config
    };
  }

  protected async connect(
    rpcAddr: string,
    homeDir: string,
    init?: boolean
  ): Promise<void> {
    const keyFile = require(join(homeDir, "validator_key.json"));
    this.masterKey = nearAPI.utils.KeyPair.fromString(
      keyFile.secret_key || keyFile.private_key
    );
    const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(
      homeDir
    );
    if (init) {
      await keyStore.setKey(
        this.config.network,
        this.config.rootAccountName,
        this.masterKey
      );
    }
    this.near = await nearAPI.connect({
      keyStore,
      networkId: this.config.network,
      nodeUrl: rpcAddr,
    });
    this.root = new Account(new nearAPI.Account(
      this.near.connection,
      this.config.rootAccountName
    ));
  }

  checkConnected(): void {
    if (!this.root || !this.near || !this.masterKey) {
      throw new Error('need to call `connect`');
    }
  }

  get pubKey(): nearAPI.utils.key_pair.PublicKey {
    this.checkConnected();
    return this.masterKey!.getPublicKey();
  }

  async createAccount(name: string): Promise<Account> {
    this.checkConnected();
    const pubKey = await this.near!.connection.signer.createKey(
      name,
      this.config.network
    );
    await this.root!.najAccount.createAccount(
      name,
      pubKey,
      new BN(10).pow(new BN(25))
    );
    return this.getAccount(name);
  }

  async createAndDeploy(
    name: string,
    wasm: string,
    initialDeposit: BN = new BN(10).pow(new BN(25))
  ): Promise<ContractAccount> {
    this.checkConnected();
    const pubKey = await this.near!.connection.signer.createKey(
      name,
      this.config.network
    );
    const najContractAccount =
      await this.root!.najAccount.createAndDeployContract(
        name,
        pubKey,
        await fs.readFile(wasm),
        initialDeposit
      );
    return new ContractAccount(najContractAccount);
  }

  getRoot(): Account {
    this.checkConnected();
    return this.root!;
  }

  getAccount(name: string): Account {
    this.checkConnected();
    return new Account(
      new nearAPI.Account(this.near!.connection, name)
    );
  }

  getContractAccount(name: string): ContractAccount {
    this.checkConnected();
    return new ContractAccount(
      new nearAPI.Account(this.near!.connection, name)
    );
  }
}

export class TestnetRuntime extends Runtime {
  get defaultConfig(): Config {
    return {
      homeDir: '',
      port: 3030,
      init: true,
      rm: false,
      refDir: null,
      network: 'testnet',
      rootAccountName: 'oh-no',
    }
  }
  async run(_fn: TestRunnerFn): Promise<Runtime> {
    throw new Error("TestnetRuntime coming soon!");
  }
}

class SandboxRuntime extends Runtime {
  get defaultConfig(): Config {
    const port = SandboxServer.nextPort();
    return {
      homeDir: getHomeDir(port),
      port,
      init: true,
      rm: false,
      refDir: null,
      network: 'sandbox',
      rootAccountName: 'test.near',
    };
  }

  async run(f: TestRunnerFn): Promise<Runtime> {
    const server = await SandboxServer.init(this.config);
    try {
      await server.start(); // Wait until server is ready
      await this.connect(
        server.rpcAddr,
        server.homeDir,
        this.config.init
      );
      await f(this);
      return this;
    } catch (e){
      console.error(e)
      throw e
    } finally {
      debug("Closing server with port " + server.port);
      server.close();
    }
  }
}
