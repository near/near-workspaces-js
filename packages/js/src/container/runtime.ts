import {Buffer} from 'buffer';
import {join} from 'path';
import {NEAR} from 'near-units';
import {getNetworkFromEnv, urlConfigFromNetwork} from '../utils';
import {ClientConfig, FinalExecutionOutcome} from '../types';
import {AccountManager, NearAccount, NearAccountManager} from '../account';
import {AccountArgs, Config, InitWorkspaceFn, ReturnedAccounts, WorkspaceFn} from '../interfaces';
import {JsonRpcProvider} from '../jsonrpc';
import {debug} from '../internal-utils';
import {SandboxServer} from './server';

type AccountShortName = string;
type AccountId = string;
export abstract class WorkspaceContainer {
  config: Config; // Should be protected?
  returnedAccounts: Map<AccountId, AccountShortName> = new Map();

  protected manager!: NearAccountManager;
  protected createdAccounts: ReturnedAccounts = {};

  constructor(config: Config, accounts?: ReturnedAccounts) {
    debug('Lifecycle.WorkspaceContainer.constructor', 'config:', config, 'accounts:', accounts);
    this.config = config;
    this.manager = AccountManager.create(config);
    if (accounts) {
      this.createdAccounts = accounts;
    }
  }

  static async create(
    config: Partial<Config>,
    fn?: InitWorkspaceFn,
  ): Promise<WorkspaceContainer> {
    debug('Lifecycle.WorkspaceContainer.create()', 'config:', config, 'fn:', fn);
    switch (config.network ?? getNetworkFromEnv()) {
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
    fn: WorkspaceFn,
    config: Partial<Config> = {},
  ): Promise<void> {
    debug('Lifecycle.WorkspaceContainer.createAndRun()', 'fn:', fn, 'config:', config);
    const runtime = await WorkspaceContainer.create(config);
    await runtime.fork(fn);
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

  async fork(fn: WorkspaceFn): Promise<void> {
    debug('Lifecycle.WorkspaceContainer.fork()', 'fn:', fn, 'this.config:', this.config);
    try {
      await this.beforeRun();
      await fn(this.accounts, this);
    } catch (error: unknown) {
      if (error instanceof Error) {
        debug(error.stack);
      }

      throw error; // Figure out better error handling
    } finally {
      try {
        // Do any needed teardown
        await this.afterRun();
      } catch (error: unknown) {
        if (error instanceof Error) {
          debug('Failed to clean up after run');
          debug(error);
          throw error; // eslint-disable-line no-unsafe-finally
        }
      }
    }
  }

  async createRun(fn: InitWorkspaceFn): Promise<ReturnedAccounts> {
    debug('Lifecycle.WorkspaceContainer.createRun()', 'fn:', fn, 'config:', this.config);
    try {
      await this.beforeRun();
      const accounts = await fn({workspace: this, root: this.root});
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

  abstract importAccount(): Promise<WorkspaceContainer>;
  protected abstract beforeRun(): Promise<void>;
  protected abstract afterRun(): Promise<void>;
}

export class TestnetRuntime extends WorkspaceContainer {
  static async create(config: Partial<Config>, initFn?: InitWorkspaceFn): Promise<TestnetRuntime> {
    debug('Lifecycle.TestnetRuntime.create()', 'config:', config, 'initFn:', initFn);
    // Add better error handling
    const fullConfig = {...this.defaultConfig, initFn, ...config};
    debug('Skipping initialization function for testnet; will run before each `workspace.fork`');
    const runtime = new TestnetRuntime(fullConfig);
    await runtime.manager.init();
    return runtime;
  }

  async importAccount(): Promise<TestnetRuntime> {
    debug('Lifecycle.TestnetRuntime.importAccount()');
    const runtime = new TestnetRuntime({...this.config, init: false, initFn: this.config.initFn!}, this.createdAccounts);
    runtime.manager = await this.manager.importAccount(runtime.config);
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
    return urlConfigFromNetwork('testnet');
  }

  static get provider(): JsonRpcProvider {
    return JsonRpcProvider.from(this.clientConfig);
  }

  static get baseAccountId(): string {
    return 'testnet';
  }

  async beforeRun(): Promise<void> {
    debug('Lifecycle.TestnetRuntime.beforeRun()');
    if (this.config.initFn) {
      this.createdAccounts = await this.config.initFn({workspace: this, root: this.root});
    }
  }

  async afterRun(): Promise<void> {
    debug('Lifecycle.TestnetRuntime.afterRun()');
    await this.manager.cleanup();
  }
}

export class SandboxRuntime extends WorkspaceContainer {
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
    fn?: InitWorkspaceFn,
  ): Promise<SandboxRuntime> {
    debug('Lifecycle.SandboxRuntime.create()', 'config:', config, 'fn:', fn);
    const defaultConfig = await this.defaultConfig();
    const sandbox = new SandboxRuntime({...defaultConfig, ...config});
    if (fn) {
      await sandbox.createRun(fn);
    }

    return sandbox;
  }

  async createAndRun(
    fn: WorkspaceFn,
    config: Partial<Config> = {},
  ): Promise<void> {
    debug('Lifecycle.SandboxRuntime.createAndRun()', 'fn:', fn, 'config:', config);
    await WorkspaceContainer.createAndRun(fn, config);
  }

  async importAccount(): Promise<SandboxRuntime> {
    debug('Lifecycle.SandboxRuntime.createAndrun()');
    let config = await SandboxRuntime.defaultConfig();
    config = {...this.config, ...config, init: false, refDir: this.homeDir};
    const runtime = new SandboxRuntime(config, this.createdAccounts);
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
      initialBalance: NEAR.parse('100 N').toJSON(),
    };
  }

  get provider(): JsonRpcProvider {
    return JsonRpcProvider.from(this.rpcAddr);
  }

  get rpcAddr(): string {
    return `http://localhost:${this.config.port}`;
  }

  async beforeRun(): Promise<void> {
    debug('Lifecycle.SandboxRuntime.beforeRun()');
    // If (!(await exists(SandboxRuntime.LINKDROP_PATH))) {
    //   debug(`Downloading testnet's linkdrop to ${SandboxRuntime.LINKDROP_PATH}`);
    //   await fs.writeFile(SandboxRuntime.LINKDROP_PATH, await TestnetRuntime.provider.viewCode('testnet'));
    // }

    this.server = await SandboxServer.init(this.config);
    await this.server.start();
    if (this.config.init) {
      await this.manager.init();
    //   Console.log(await this.manager.getKey(this.config.rootAccount!))
      // await this.root.createAndDeploy('sandbox', SandboxRuntime.LINKDROP_PATH);
      // debug('Deployed \'sandbox\' linkdrop contract');
    }
  }

  async afterRun(): Promise<void> {
    debug('Lifecycle.SandboxRuntime.afterRun()');
    try {
      await this.server.close();
    } catch (error: unknown) {
      debug('this.server.close() threw error.', JSON.stringify(error, null, 2));
    }
  }
}
