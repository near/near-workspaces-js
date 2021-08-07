import { promises as fs } from "fs";
import BN from "bn.js";
import * as nearAPI from "near-api-js";
import { join } from "path";
import { Account, ContractAccount } from './account'
import { SandboxServer, getHomeDir } from './server';
import { debug } from '../utils';

export type RunnerFn = (s: Runtime) => Promise<void>;

export interface Config {
  homeDir: string;
  port: number;
  init: boolean;
  rm: boolean;
  refDir: string | null;
  network: 'sandbox' | 'testnet';
  rootAccountName: string;
  rpcAddr: string;
  helperUrl?: string;
  intialBalance?: string;
  walletUrl?: string;
}

export abstract class Runtime {
  static async create(config: Partial<Config>): Promise<Runtime> {
    if (config.network === 'testnet') {
      return new TestnetRuntime(config)
    }
    return new SandboxRuntime(config)
  }

  abstract get defaultConfig(): Config;
  
  abstract setup(): Promise<void>;
  abstract tearDown(): Promise<void>;

  protected root!: Account;
  protected near!: nearAPI.Near;
  protected masterKey!: nearAPI.KeyPair;

  // TODO: should probably be protected
  config: Config;

  constructor(config: Partial<Config>) {
    this.config = this.getConfig(config);
  }

  get homeDir(): string {
    return this.config.homeDir;
  }

  get init(): boolean {
    return this.config.init;
  }

  get rpcAddr(): string {
    return this.config.rpcAddr;
  }

  private getConfig(config: Partial<Config>): Config {
    return {
      ...this.defaultConfig,
      ...config
    };
  }

  async getKeyStore(): Promise<nearAPI.keyStores.KeyStore> {
    const keyFile = require(join(this.homeDir, "validator_key.json"));
    this.masterKey = nearAPI.utils.KeyPair.fromString(
      keyFile.secret_key || keyFile.private_key
    );
    const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(
      this.homeDir
    );
    if (this.init) {
      await keyStore.setKey(
        this.config.network,
        this.config.rootAccountName,
        this.masterKey
      );
    }
    return keyStore;
  }

  async connect(): Promise<void> {
    const keyStore = await this.getKeyStore();
    this.near = await nearAPI.connect({
      keyStore,
      networkId: this.config.network,
      nodeUrl: this.rpcAddr,
    });
    this.root = new Account(new nearAPI.Account(
      this.near.connection,
      this.config.rootAccountName
    ));
  }


  get pubKey(): nearAPI.utils.key_pair.PublicKey {
    return this.masterKey.getPublicKey();
  }

  async createAccount(name: string): Promise<Account> {
    const pubKey = await this.near.connection.signer.createKey(
      name,
      this.config.network
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
    initialDeposit: BN = new BN(10).pow(new BN(25))
  ): Promise<ContractAccount> {
    const pubKey = await this.near.connection.signer.createKey(
      name,
      this.config.network
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
    return new Account(
      new nearAPI.Account(this.near.connection, name)
    );
  }

  getContractAccount(name: string): ContractAccount {
    return new ContractAccount(
      new nearAPI.Account(this.near.connection, name)
    );
  }

  isSandbox(): boolean {
    return this.config.network == "sandbox";
  }

  isTestnet(): boolean {
    return this.config.network == "testnet";
  }
}

export class TestnetRuntime extends Runtime {
  // Doesn't need setup or tearDown since the server is already live
  async setup(): Promise<void> {}
  async tearDown(): Promise<void> {}
  
  get defaultConfig(): Config {
    return {
      homeDir: '',
      port: 3030,
      init: true,
      rm: false,
      refDir: null,
      network: 'testnet',
      rootAccountName: 'oh-no',
      rpcAddr: 'https://rpc.testnet.near.org',
      walletUrl: "https://wallet.testnet.near.org",
      helperUrl: "https://helper.testnet.near.org",
    }
  }
  async run(_fn: RunnerFn): Promise<Runtime> {
    throw new Error("TestnetRuntime coming soon!");
  }
}

class SandboxRuntime extends Runtime {
  private server!: SandboxServer;

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
      rpcAddr: `http://localhost:${port}`
    };
  }

  async setup(): Promise<void> {
    this.server = await SandboxServer.init(this.config);
    await this.server.start();
  }

  async tearDown(): Promise<void> {
    debug("Closing server with port " + this.server.port);
    this.server.close();
  }

}
