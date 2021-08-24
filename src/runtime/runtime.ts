import {Buffer} from 'buffer';
import {join} from 'path';
import {promises as fs} from 'fs';
import {toYocto} from '../helper-funcs';
import {FinalExecutionOutcome} from '../types';
import {AccountManager, NearAccount, NearAccountManager} from '../account';
import {AccountArgs, ClientConfig, Config, CreateRunnerFn, ReturnedAccounts, RunnerFn} from '../interfaces';
import {JSONRpc} from '../jsonrpc';
import {debug, exists} from '../utils';
import {SandboxServer} from './server';

type AccountShortName = string;
type AccountId = string;

const DEFAULT_INITIAL_DEPOSIT: string = toYocto('100');
export abstract class Runtime {
  config: Config; // Should be protected?
  returnedAccounts: Map<AccountId, AccountShortName> = new Map();

  protected manager!: NearAccountManager;
  protected createdAccounts: ReturnedAccounts = {};

  constructor(config: Config, accounts?: ReturnedAccounts) {
    this.config = config;
    if (accounts) {
      this.createdAccounts = accounts;
    }
  }

  static async create(
    config: Partial<Config>,
    fn?: CreateRunnerFn,
  ): Promise<Runtime> {
    switch (config.network) {
      case 'testnet':
        return TestnetRuntime.create(config, fn);
      case 'sandbox':
        return SandboxRuntime.create(config, fn);
      default:
        throw new Error(
          `config.network = '${config.network}' invalid; ` // eslint-disable-line @typescript-eslint/restrict-template-expressions
            + 'must be \'testnet\' or \'sandbox\' (the default). Soon \'mainnet\'',
        );
    }
  }

  static async createAndRun(
    fn: RunnerFn,
    config: Partial<Config> = {},
  ): Promise<void> {
    const runtime = await Runtime.create(config);
    await runtime.run(fn);
  }

  protected get accounts(): AccountArgs {
    return {root: this.manager.root, ...Object.fromEntries(
      Object.entries(this.createdAccounts).map(([argName, account]: [string, NearAccount]) => [
        argName,
        this.manager.getAccount(account.accountId),
      ]),
    )};
  }

  protected get homeDir(): string {
    return this.config.homeDir;
  }

  protected get init(): boolean {
    return this.config.init;
  }

  protected get root(): NearAccount {
    return this.manager.root;
  }

  isSandbox(): boolean {
    return this.config.network === 'sandbox';
  }

  isTestnet(): boolean {
    return this.config.network === 'testnet';
  }

  async run(fn: RunnerFn): Promise<void> {
    debug('About to runtime.run with config', this.config);
    try {
      debug('About to call setup');
      await this.setup();
      debug('About to call beforeRun');
      await this.beforeRun();
      await fn(this.accounts, this);
    } catch (error: unknown) {
      if (error instanceof Error) {
        debug(error.stack);
      }

      throw error; // Figure out better error handling
    } finally {
      // Do any needed teardown
      await this.afterRun();
    }
  }

  async createRun(fn: CreateRunnerFn): Promise<ReturnedAccounts> {
    debug('About to runtime.createRun with config', this.config);
    try {
      debug('About to call setup');
      await this.setup();
      debug('About to call beforeRun');
      await this.beforeRun();
      const accounts = await fn({runtime: this, root: this.root});
      this.createdAccounts = {...this.createdAccounts, ...accounts};
      return accounts;
    } catch (error: unknown) {
      if (error instanceof Buffer || typeof error === 'string') {
        debug(error);
      }

      throw error; // Figure out better error handling
    } finally {
      // Do any needed teardown
      await this.afterRun();
    }
  }

  async executeTransaction(fn: () => Promise<FinalExecutionOutcome>): Promise<FinalExecutionOutcome> {
    return fn();
  }


  abstract createFrom(): Promise<Runtime>;
  protected abstract setup(): Promise<void>;
  protected abstract beforeRun(): Promise<void>;
  protected abstract afterRun(): Promise<void>;
}

export class TestnetRuntime extends Runtime {
  static async create(config: Partial<Config>, fn?: CreateRunnerFn): Promise<TestnetRuntime> {
    // Add better error handling
    const fullConfig = {...this.defaultConfig, initFn: fn, ...config};
    // Const accountManager = await AccountManager.create(fullConfig.rootAccount ?? filename, TestnetRuntime.KEYSTORE_PATH, TestnetRuntime);
    debug('Skipping initialization function for testnet; will run before each `runner.run`');
    const runtime = new TestnetRuntime(fullConfig);
    runtime.manager = await AccountManager.create(runtime.config);
    return runtime;
  }

  async createFrom(): Promise<TestnetRuntime> {
    const runtime = new TestnetRuntime({...this.config, init: false, initFn: this.config.initFn!}, this.createdAccounts);
    runtime.manager = await this.manager.createFrom(runtime.config);
    return runtime;
  }

  static get defaultConfig(): Config {
    return {
      homeDir: 'ignored',
      port: 3030,
      init: true,
      rm: false,
      refDir: null,
      ...this.clientConfig,
    };
  }

  static get clientConfig(): ClientConfig {
    return {
      network: 'testnet',
      rpcAddr: 'https://rpc.testnet.near.org',
      walletUrl: 'https://wallet.testnet.near.org',
      helperUrl: 'https://helper.testnet.near.org',
      explorerUrl: 'https://explorer.testnet.near.org',
      initialBalance: DEFAULT_INITIAL_DEPOSIT,
    };
  }

  static get provider(): JSONRpc {
    return JSONRpc.from(this.clientConfig);
  }

  static get baseAccountId(): string {
    return 'testnet';
  }

  async setup(): Promise<void> {
    // Not needed
  }

  async beforeRun(): Promise<void> {
    if (this.config.initFn) {
      debug('About to run initFn');
      this.createdAccounts = await this.config.initFn({runtime: this, root: this.root});
    }
  }

  async afterRun(): Promise<void> {
    await this.manager.cleanup();
  }
}

export class SandboxRuntime extends Runtime {
  private static readonly LINKDROP_PATH = join(__dirname, '..', '..', 'core_contracts', 'testnet-linkdrop.wasm');
  // Edit genesis.json to add `sandbox` as an account
  private static get BASE_ACCOUNT_ID() {
    return 'test.near';
  }

  private server!: SandboxServer;

  static async defaultConfig(): Promise<Config> {
    const port = await SandboxServer.nextPort();
    return {
      ...this.clientConfig,
      homeDir: SandboxServer.randomHomeDir(),
      port,
      init: true,
      rm: false,
      refDir: null,
      rpcAddr: `http://localhost:${port}`,
    };
  }

  static async create(
    config: Partial<Config>,
    fn?: CreateRunnerFn,
  ): Promise<SandboxRuntime> {
    const defaultConfig = await this.defaultConfig();
    const sandbox = new SandboxRuntime({...defaultConfig, ...config});
    if (fn) {
      debug(
        'Running initialization function to set up sandbox for all future calls to `runner.run`',
      );
      await sandbox.createRun(fn);
    }

    return sandbox;
  }

  async createAndRun(
    fn: RunnerFn,
    config: Partial<Config> = {},
  ): Promise<void> {
    await Runtime.createAndRun(fn, config);
  }

  async createFrom(): Promise<SandboxRuntime> {
    let config = await SandboxRuntime.defaultConfig();
    config = {...this.config, ...config, init: false, refDir: this.homeDir};
    const runtime = new SandboxRuntime(config, this.createdAccounts);
    runtime.manager = await this.manager.createFrom(runtime.config);
    return runtime;
  }

  get baseAccountId(): string {
    return SandboxRuntime.BASE_ACCOUNT_ID;
  }

  static get clientConfig(): ClientConfig {
    return {
      network: 'sandbox',
      rootAccount: SandboxRuntime.BASE_ACCOUNT_ID,
      rpcAddr: '', // With be over written
      initialBalance: toYocto('100'),
    };
  }

  get provider(): JSONRpc {
    return JSONRpc.from(this.rpcAddr);
  }

  get rpcAddr(): string {
    return `http://localhost:${this.config.port}`;
  }

  async beforeRun(): Promise<void> {
    if (this.config.init) {
      await this.root.createAndDeploy('sandbox', SandboxRuntime.LINKDROP_PATH);
      debug('Deployed \'sandbox\' linkdrop contract');
    }
  }

  async setup(): Promise<void> {
    if (!(await exists(SandboxRuntime.LINKDROP_PATH))) {
      debug(`Downloading testnet's linkdrop to ${SandboxRuntime.LINKDROP_PATH}`);
      await fs.writeFile(SandboxRuntime.LINKDROP_PATH, await TestnetRuntime.provider.viewCode('testnet'));
    }

    this.server = await SandboxServer.init(this.config);
    await this.server.start();
    if (this.init) {
      this.manager = await AccountManager.create(this.config);
    }
  }

  async afterRun(): Promise<void> {
    debug(`Closing server with port ${this.config.port}`);
    await this.server.close();
  }
}
