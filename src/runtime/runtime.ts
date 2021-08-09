import { promises as fs } from "fs";
import * as nearAPI from "near-api-js";
import { join } from "path";
import * as os from "os";
import { Account, ContractAccount } from './account'
import { SandboxServer, getHomeDir } from './server';
import { debug } from '../utils';

export type RunnerFn = (s: Runtime) => Promise<void>;

const DEFAULT_INITIAL_DEPOSIT = "1" + "0".repeat(25);

function randomAccountId(): string {
  let accountId;
  // create random number with at least 7 digits
  const randomNumber = Math.floor(Math.random() * (9999999 - 1000000) + 1000000);
  accountId = `dev-${Date.now()}-${randomNumber}`;
  return accountId;
}

async function getKeyFromFile(filePath: string): Promise<nearAPI.KeyPair> {
  try {
    const keyFile = require(filePath);
    return nearAPI.utils.KeyPair.fromString(
      keyFile.secret_key || keyFile.private_key
    );
  } catch (e) {
    const keyFile = await fs.open(filePath, "w");
    const keyPair = nearAPI.utils.KeyPairEd25519.fromRandom();
    await keyFile.writeFile(JSON.stringify({
      secret_key: keyPair.toString()
    }));
    keyFile.close();
    return keyPair;
  }
}

export interface Config {
  homeDir: string;
  port: number;
  init: boolean;
  rm: boolean;
  refDir: string | null;
  network: 'sandbox' | 'testnet';
  masterAccount?: string;
  rpcAddr: string;
  helperUrl?: string;
  initialBalance?: string;
  walletUrl?: string;
  initFn?: RunnerFn;
}

export abstract class Runtime {
  static async create(config: Partial<Config>, f?: RunnerFn): Promise<Runtime> {
    if (config.network === 'testnet') {
      const runtime = new TestnetRuntime(config)
      if (f) {
        debug('Skipping initialization function for testnet; will run before each `runner.run`');
      }
      return runtime;
    } else {
      const runtime = new SandboxRuntime(config);
      if (f) {
        debug('Running initialization function to set up sandbox for all future calls to `runner.run`');
        await runtime.run(f);
      }
      return runtime;
    }
  }

  abstract get defaultConfig(): Config;
  abstract get keyFilePath(): string;

  abstract setup(): Promise<void>;
  abstract tearDown(): Promise<void>;

  protected root!: Account;
  protected near!: nearAPI.Near;
  protected masterKey!: nearAPI.KeyPair;
  protected keyStore!: nearAPI.keyStores.KeyStore;

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
    return this.config.masterAccount!;
  }

  private getConfig(config: Partial<Config>): Config {
    return {
      ...this.defaultConfig,
      ...config
    };
  }

  abstract getKeyStore(): Promise<nearAPI.keyStores.KeyStore>;

  async connect(): Promise<void> {
    this.near = await nearAPI.connect({
      keyStore: this.keyStore,
      networkId: this.config.network,
      nodeUrl: this.rpcAddr,
      masterAccount: this.masterAccount,
      helperUrl: this.config.helperUrl,
      walletUrl: this.config.walletUrl,
      initialBalance: this.config.initialBalance,
    });
    this.root = new Account(new nearAPI.Account(
      this.near.connection,
      this.masterAccount
    ));
  }

  async run(fn: RunnerFn): Promise<void> {
    try {
      // Run any setup before trying to connect to a server
      debug("About to call setup")
      this.keyStore = await this.getKeyStore();
      await this.setup();
      // Set up connection to node
      debug("About to connect")
      await this.connect();
      // Run function
      await fn(this);
    } catch (e){
      console.error(e)
      throw e; //TODO Figure out better error handling
    } finally {
      // Do any needed teardown
      await this.tearDown();
    }
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
  ): Promise<ContractAccount> {
    const pubKey = await this.addKey(name);
    await this.near.accountCreator.createAccount(
      name,
      pubKey
    );
    const najAccount = this.near.account(name);
    const contractData = await fs.readFile(wasm);
    const result = await najAccount.deployContract(contractData);
    debug(`deployed contract ${wasm} to account ${name} with result ${JSON.stringify(result)}`);
    return new ContractAccount(najAccount);
  }

  getRoot(): Account {
    return this.root;
  }

  getAccount(name: string): Account {
    return new Account(this.near.account(name));
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

  get keyFilePath(): string {
    return join(`${os.homedir()}/.near-credentials/testnet`, `${this.masterAccount}.json`);
  }

  async getKeyStore(): Promise<nearAPI.keyStores.KeyStore> {
    const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(
      this.homeDir
    );
    return keyStore;
  }

  // Run inital function so that function starts at initial state
  async setup(): Promise<void> {
    if (this.config.masterAccount) {
      throw new Error('custom masterAccount not yet supported on testnet');
      // create sub-accounts of it with random IDs
      this.config.masterAccount = `${randomAccountId()}.something`
    } else {
      // create new `dev-deploy`-style account (or reuse existing)
      this.config.masterAccount = randomAccountId()
    }
    if (this.config.initFn) {
      await this.run(this.config.initFn);
    }
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
  ): Promise<ContractAccount> {
    // TODO: dev deploy!!
    return super.createAndDeploy(name, wasm);
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
      masterAccount: 'test.near',
      rpcAddr: `http://localhost:${port}`,
      initialBalance: DEFAULT_INITIAL_DEPOSIT,
    };
  }

  get keyFilePath(): string {
    return join(this.homeDir, "validator_key.json");
  }

  async getKeyStore(): Promise<nearAPI.keyStores.KeyStore> {
    const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(
      this.homeDir
    );
    return keyStore;
  }

  get rpcAddr(): string {
    return `http://localhost:${this.config.port}`;
  }

  async setup(): Promise<void> {
    this.server = await SandboxServer.init(this.config);
    if (this.init) {
      const masterKey = await getKeyFromFile(this.keyFilePath);
      await this.keyStore.setKey(
        this.config.network,
        this.masterAccount,
        masterKey
      );
    }
    await this.server.start();
  }

  async tearDown(): Promise<void> {
    debug("Closing server with port " + this.server.port);
    this.server.close();
  }

}
