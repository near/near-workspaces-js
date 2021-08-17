import { promises as fs } from "fs";
import * as nearAPI from "near-api-js";
import { join, dirname } from "path";
import * as os from "os";
import { Account } from './account'
import tmpDir from "temp-dir";
import { SandboxServer } from './server';
import { debug, exists } from './utils';
import { toYocto } from '../utils';
import { KeyPair, PublicKey } from '../types';
import { FinalExecutionOutcome } from "../provider";

interface RuntimeArg {
  runtime: Runtime;
  root: Account;
}

export interface ReturnedAccounts {
  [key: string]: Account;
}

export interface AccountArgs extends ReturnedAccounts {
  root: Account;
}

export type CreateRunnerFn = (args: RuntimeArg) => Promise<ReturnedAccounts>;
export type RunnerFn = (args: AccountArgs, runtime: Runtime) => Promise<void>;
type AccountShortName = string;
type AccountId = string;
type UserPropName = string;
type SerializedReturnedAccounts = Map<UserPropName, AccountShortName>;

const DEFAULT_INITIAL_DEPOSIT: string = toYocto("10");

function randomAccountId(): string {
  let accountId;
  // create random number with at least 7 digits
  const randomNumber = Math.floor(Math.random() * (9999999 - 1000000) + 1000000);
  accountId = `dev-${Date.now()}-${randomNumber}`;
  return accountId;
}

async function getKeyFromFile(filePath: string, create: boolean = true): Promise<KeyPair> {
  try {
    const keyFile = require(filePath);
    return nearAPI.utils.KeyPair.fromString(
      keyFile.secret_key || keyFile.private_key
    );
  } catch (e) {
    if (!create) throw e;
    debug("about to write to ", filePath)
    const keyPair = nearAPI.utils.KeyPairEd25519.fromRandom();
    await fs.writeFile(filePath, JSON.stringify({
      secret_key: keyPair.toString()
    }));
    debug("wrote to file ", filePath);
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
  explorerUrl?: string;
  initialBalance?: string;
  walletUrl?: string;
  initFn?: CreateRunnerFn;
}

export abstract class Runtime {
  static async create(
    config: Partial<Config>,
    fn?: CreateRunnerFn
  ): Promise<Runtime> {
    switch (config.network) {
      case "testnet":
        return TestnetRuntime.create(config, fn);
      case "sandbox":
        return SandboxRuntime.create(config, fn);
      default:
        throw new Error(
          `config.network = '${config.network}' invalid; ` +
            "must be 'testnet' or 'sandbox' (the default). Soon 'mainnet'"
        );
    }
  }

  abstract afterRun(): Promise<void>;
  abstract get baseAccountId(): string;
  abstract createFrom(): Promise<Runtime>;
  abstract getKeyStore(): Promise<nearAPI.keyStores.KeyStore>;
  abstract get keyFilePath(): string;

  protected root!: Account;
  near!: nearAPI.Near;
  protected masterKey!: KeyPair;
  protected keyStore!: nearAPI.keyStores.KeyStore;
  protected createdAccounts: ReturnedAccounts = {};

  // TODO: should probably be protected
  config: Config;
  accountsCreated: Map<AccountId, AccountShortName> = new Map();
  resultArgs?: SerializedReturnedAccounts;

  constructor(config: Config, accounts?: ReturnedAccounts) {
    this.config = config;
    if (accounts) {
      this.createdAccounts = accounts;
    }
  }

  get accounts(): AccountArgs {
    return {...{root: this.root}, ...Object.fromEntries(
      Object.entries(this.createdAccounts).map(([argName, account]) => {
        return [
        argName,
        this.root.getAccount(account.prefix),
      ]})
    )}
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

  async getMasterKey(): Promise<KeyPair> {
    debug("reading key from file", this.keyFilePath);
    return getKeyFromFile(this.keyFilePath);
  }

  // Hook that child classes can override to add functionality before `connect` call
  async beforeConnect(): Promise<void> {}

  // Hook that child classes can override to add functionality after `connect` call
  abstract afterConnect(): Promise<void>;

  async connect(): Promise<void> {
    this.near = await nearAPI.connect({
      deps: {
        keyStore: this.keyStore,
      },
      keyPath: this.keyFilePath,
      networkId: this.config.network,
      nodeUrl: this.rpcAddr,
      walletUrl: this.config.walletUrl,
      masterAccount: this.config.masterAccount,
      initialBalance: this.config.initialBalance,
    });
    this.root = new Account(this.masterAccount, this);
  }

  async run(fn: RunnerFn, args?: SerializedReturnedAccounts): Promise<void> {
    debug("About to runtime.run with config", this.config);
    try {
      this.keyStore = await this.getKeyStore();
      debug("About to call beforeConnect");
      await this.beforeConnect();
      debug("About to call connect");
      await this.connect();
      debug("About to call afterConnect");
      await this.afterConnect();
      if (args) debug(`Passing ${Object.getOwnPropertyNames(args)}`);
      await fn(this.accounts, this);
    } catch (e) {
      debug(e.stack);
      throw e; //TODO Figure out better error handling
    } finally {
      // Do any needed teardown
      await this.afterRun();
    }
  }

  async createRun(fn: CreateRunnerFn): Promise<ReturnedAccounts> {
    debug("About to runtime.createRun with config", this.config);
    try {
      this.keyStore = await this.getKeyStore();
      debug("About to call beforeConnect");
      await this.beforeConnect();
      debug("About to call connect");
      await this.connect();
      debug("About to call afterConnect");
      await this.afterConnect();
      const accounts = await fn({ runtime: this, root: this.getRoot() });
      this.createdAccounts = {...this.createdAccounts, ...accounts};
      return accounts;
    } catch (e) {
      debug(e);
      throw e; //TODO Figure out better error handling
    } finally {
      // Do any needed teardown
      await this.afterRun();
    }
  }

  protected async addMasterAccountKey(): Promise<void> {
    const masterKey = await this.getMasterKey();
    await this.keyStore.setKey(
      this.config.network,
      this.masterAccount,
      masterKey
    );
  }

  getRoot(): Account {
    return this.root;
  }

  isSandbox(): boolean {
    return this.config.network == "sandbox";
  }

  isTestnet(): boolean {
    return this.config.network == "testnet";
  }

  async executeTransaction(fn: () => Promise<FinalExecutionOutcome> ): Promise<FinalExecutionOutcome> {
    const res = await fn();
    return res;
  }

  addAccountCreated(accountId: string, sender: Account): void {
    const short =  accountId.replace(`.${sender.accountId}`, "");
    this.accountsCreated.set(accountId, short);
  }
}

export class TestnetRuntime extends Runtime {
  static async create(config: Partial<Config>, fn?: CreateRunnerFn): Promise<TestnetRuntime> {
    debug('Skipping initialization function for testnet; will run before each `runner.run`');
    return new TestnetRuntime({...this.defaultConfig, ...{initFn: fn}, ...config});
  }

  async createFrom(): Promise<TestnetRuntime> {
    return new TestnetRuntime({...this.config,...{ init: false, initFn: this.config.initFn!}}, this.createdAccounts);
  }

  static get defaultConfig(): Config {
    return {
      homeDir: 'ignored',
      port: 3030,
      init: true,
      rm: false,
      refDir: null,
      network: 'testnet',
      rpcAddr: 'https://rpc.testnet.near.org',
      walletUrl: "https://wallet.testnet.near.org",
      helperUrl: "https://helper.testnet.near.org",
      explorerUrl: "https://explorer.testnet.near.org",
      initialBalance: DEFAULT_INITIAL_DEPOSIT,
    }
  }

  static get provider(): nearAPI.providers.JsonRpcProvider {
    return new nearAPI.providers.JsonRpcProvider(this.defaultConfig.rpcAddr);
  }

  /** 
   * Get most recent Wasm Binary of given account.
   * */ 
  static async viewCode(account_id: string): Promise<Buffer> {
    const res: any = await this.provider.query({
      request_type: 'view_code',
      finality: 'final',
      account_id
    })
    return Buffer.from(res.code_base64, 'base64');
  }

  get baseAccountId(): string {
    return "testnet";
  }

  get keyFilePath(): string {
    return join(os.homedir(), `.near-credentials`, `${this.network}`, `${this.masterAccount}.json`);
  }

  async getKeyStore(): Promise<nearAPI.keyStores.KeyStore> {
    const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(
      join(os.homedir(), `.near-credentials`)
    );
    return keyStore;
  }

  async beforeConnect(): Promise<void> {
    await this.ensureKeyFileFolder();
    const accountCreator = new nearAPI.accountCreator.UrlAccountCreator(
      ({} as any), // ignored
      this.config.helperUrl!
    );
    if (!this.config.masterAccount) {
      // create new `dev-deploy`-style account (or reuse existing)
      this.config.masterAccount = randomAccountId()
    }
    await this.addMasterAccountKey();
    await accountCreator.createAccount(
      this.masterAccount,
      (await this.getMasterKey()).getPublicKey()
    );
    debug(`Added masterAccount ${this.config.masterAccount
      } with keyStore ${this.keyStore
      } and publicKey ${await this.keyStore.getKey(
        this.config.network,
        this.masterAccount
      )
      }
      https://explorer.testnet.near.org/accounts/${this.masterAccount}`);
  }

  async afterConnect(): Promise<void> {
    if (this.config.initFn) {
      debug('About to run initFn');
      this.createdAccounts = await this.config.initFn({ runtime: this, root: this.getRoot()})
    }
  }

  // TODO: Delete any accounts created
  async afterRun(): Promise<void> { }

  private async ensureKeyFileFolder(): Promise<void> {
    const keyFolder = dirname(this.keyFilePath);
    try {
      await fs.mkdir(keyFolder, { recursive: true })
    } catch (e) {
      // TODO: check error
    }
  }
}

export class SandboxRuntime extends Runtime {
  private static readonly LINKDROP_PATH = join(__dirname, '..', '..','core_contracts', "testnet-linkdrop.wasm");
  // TODO: edit genesis.json to add sandbox as an account
  private static readonly BASE_ACCOUNT_ID = "test.near";
  private server!: SandboxServer;

  static async defaultConfig(): Promise<Config> {
    const port = await SandboxServer.nextPort();
    return {
      homeDir: SandboxServer.randomHomeDir(),
      port,
      init: true,
      rm: false,
      refDir: null,
      network: 'sandbox',
      masterAccount: SandboxRuntime.BASE_ACCOUNT_ID,
      rpcAddr: `http://localhost:${port}`,
      initialBalance: toYocto("100"),
    };
  }

  static async create(config: Partial<Config>, fn?: CreateRunnerFn): Promise<SandboxRuntime> {
    const defaultConfig = await this.defaultConfig();
    const sandbox = new SandboxRuntime({...defaultConfig, ...config});
    if (fn) {
      debug('Running initialization function to set up sandbox for all future calls to `runner.run`');
      await sandbox.createRun(fn);
    }
    return sandbox;
  }

  async createFrom(): Promise<SandboxRuntime> {
    const config = await SandboxRuntime.defaultConfig();
    return new SandboxRuntime({...config,...{init: false, refDir: this.homeDir}}, this.createdAccounts)
  }

  get baseAccountId(): string {
    return SandboxRuntime.BASE_ACCOUNT_ID;
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

  async afterConnect(): Promise<void> {
    if (this.config.init) {
      await this.root.createAndDeploy("sandbox", SandboxRuntime.LINKDROP_PATH);
      debug("Deployed 'sandbox' linkdrop contract");
    }
  }

  async beforeConnect(): Promise<void> {
    if (!(await exists(SandboxRuntime.LINKDROP_PATH))) {
      debug(`Downloading testnet's linkdrop to ${SandboxRuntime.LINKDROP_PATH}`)
      await fs.writeFile(SandboxRuntime.LINKDROP_PATH, await TestnetRuntime.viewCode("testnet"));
    }
    this.server = await SandboxServer.init(this.config);
    if (this.init) await this.addMasterAccountKey();
    await this.server.start();
  }

  async afterRun(): Promise<void> {
    debug("Closing server with port " + this.config.port);
    this.server.close();
  }
}
