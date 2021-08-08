import { promises as fs } from "fs";
import BN from "bn.js";
import * as nearAPI from "near-api-js";
import { KeyPair } from "near-api-js";
import { join } from "path";
import { Account, ContractAccount } from './account'
import { SandboxServer, getHomeDir } from './server';
import { debug } from '../utils';

export type RunnerFn = (s: Runtime) => Promise<void>;

const DEFAULT_INITIAL_DEPOSIT = "1" + "0".repeat(25);

export interface Config {
  homeDir: string;
  port: number;
  init: boolean;
  rm: boolean;
  refDir: string | null;
  network: 'sandbox' | 'testnet';
  rootAccountName?: string;
  rpcAddr: string;
  helperUrl?: string;
  initialBalance?: string;
  walletUrl?: string;
  initFn?: RunnerFn;
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

  get network(): string {
    return this.config.network;
  }

  get masterAccount(): string {
    return this.config.rootAccountName!;
  }

  private getConfig(config: Partial<Config>): Config {
    const defaultConfig = this.defaultConfig;
    defaultConfig.rootAccountName = config.rootAccountName || this.randomAccountId();
    return {
      ...this.defaultConfig,
      ...config
    };
  }

  private async getKeyFromFile(): Promise<nearAPI.KeyPair> {
    const filePath = join(this.homeDir, "validator_key.json");
    try {
      const keyFile = require(filePath);
      return nearAPI.utils.KeyPair.fromString(
        keyFile.secret_key || keyFile.private_key
      );
    } catch (e) {
      
    }
    const file = await fs.open(filePath, "w");
    const keyPair = nearAPI.utils.KeyPairEd25519.fromRandom();
    await file.writeFile(JSON.stringify({
      secret_key: keyPair.toString()
    }));
    file.close();
    return keyPair;
  }

  async getKeyStore(): Promise<nearAPI.keyStores.KeyStore> {
    this.masterKey = await this.getKeyFromFile();
    const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(
      this.homeDir
    );
    if (this.init) {
      await keyStore.setKey(
        this.config.network,
        this.masterAccount,
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
      masterAccount: this.masterAccount,
    });
    this.root = new Account(new nearAPI.Account(
      this.near.connection,
      this.masterAccount
    ));
  }

  get pubKey(): nearAPI.utils.key_pair.PublicKey {
    return this.masterKey.getPublicKey();
  }

  async createAccount(name: string, keyPair?: nearAPI.utils.key_pair.KeyPair): Promise<Account> {
    const pubKey = await this.addKey(name, keyPair);
    await this.near.accountCreator.createAccount(
      name,
      pubKey
    );
    return this.getAccount(name);
  }

  async createAndDeploy(
    name: string,
    wasm: string,
    initialDeposit: BN = new BN(10).pow(new BN(25))
  ): Promise<ContractAccount> {
    const pubKey = await this.addKey(name);
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
  
  protected randomAccountId(keyPair?: nearAPI.KeyPair): string {
    let accountId;
    // create random number with at least 7 digits
    const randomNumber = Math.floor(Math.random() * (9999999 - 1000000) + 1000000);
    accountId = `dev-${Date.now()}-${randomNumber}`;
    return accountId;
  }

  protected async addKey(name: string, keyPair?: nearAPI.KeyPair): Promise<nearAPI.utils.PublicKey> {
    let pubKey: nearAPI.utils.key_pair.PublicKey;
    if (keyPair) {
      const key = await nearAPI.InMemorySigner.fromKeyPair(this.network, name, keyPair);
      pubKey = await key.getPublicKey();
    } else {
      pubKey = await this.near.connection.signer.createKey(
      name,
      this.config.network
     );
    }
    return pubKey;
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
      rpcAddr: 'https://rpc.testnet.near.org',
      walletUrl: "https://wallet.testnet.near.org",
      helperUrl: "https://helper.testnet.near.org"
    }
  }

  // Run inital function so that function starts at initial state
  async setup(): Promise<void> {

  }

  // Delete any accounts created
  async tearDown(): Promise<void> {

  }

  // TODO: create temp account and track to be deleted
  createAccount(name: string, keyPair?: nearAPI.KeyPair): Promise<Account> {
    return super.createAccount(name, keyPair);
  }

  async createAndDeploy(
    name: string,
    wasm: string,
    initialDeposit: BN = new BN(10).pow(new BN(25))
  ): Promise<ContractAccount> {
    // TODO: dev deploy!!
    return super.createAndDeploy(name, wasm, initialDeposit);
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
      rpcAddr: `http://localhost:${port}`,
      initialBalance: DEFAULT_INITIAL_DEPOSIT,
    };
  }

  get rpcAddr(): string {
    return `http://localhost:${this.config.port}`;
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
