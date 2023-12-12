import fs from 'fs';
import {NEAR} from 'near-units';
import {lock} from 'proper-lockfile';
import {getNetworkFromEnv, urlConfigFromNetwork} from './utils';
import {Config, ClientConfig} from './types';
import {AccountManager, NearAccount, NearAccountManager} from './account';
import {JsonRpcProvider} from './jsonrpc';
import {debug} from './internal-utils';
import {SandboxServer} from './server/server';

/**
 * The main interface to near-workspaces. Create a new worker instance with {@link Worker.init}, then run code on it.
 */
export abstract class Worker {
  protected config: Config;

  protected manager!: NearAccountManager;

  protected tx_callbacks?: Array<(burnt: number) => void>;

  constructor(config: Config) {
    debug('Lifecycle.Worker.constructor', 'config:', config);
    this.config = config;
    this.manager = AccountManager.create(config);
  }

  /**
   * Initialize a new worker.
   *
   * In local sandbox mode, this will:
   *   - Create a new local blockchain
   *   - Load the root account for that blockchain, available as `root`:
   *
   * In testnet mode, the same functionality is achieved via different means:
   * creating a new account as the `root`.
   * Since all actions must occur on one blockchain instead of N.
   *
   * @param config a configuration object
   * @returns an instance of the Worker class
   */
  static async init(config: Partial<Config> = {}): Promise<Worker> {
    debug('Lifecycle.Worker.init()', 'config:', config);
    switch (config.network ?? getNetworkFromEnv()) {
      case 'testnet':
        return TestnetWorker.init(config);
      case 'sandbox':
        return SandboxWorker.init(config);
      default:
        throw new Error(
          `config.network = '${config.network}' invalid; ` // eslint-disable-line @typescript-eslint/restrict-template-expressions
            + 'must be \'testnet\' or \'sandbox\' (the default). Soon \'mainnet\'',
        );
    }
  }

  /**
   * Registers a callback function to be triggered
   * whenever a transaction completes.
   * @param fn is added to the tx_callbacks
   */
  add_callback(fn: (burnt: number) => void) {
    if (this.tx_callbacks === undefined) {
      this.tx_callbacks = [fn];
      return;
    }

    this.tx_callbacks.push(fn);
  }

  get rootAccount(): NearAccount {
    return this.manager.root;
  }

  abstract get provider(): JsonRpcProvider;

  abstract tearDown(): Promise<void>;
}

export class TestnetWorker extends Worker {
  static async init(config: Partial<Config>): Promise<TestnetWorker> {
    debug('Lifecycle.TestnetWorker.create()', 'config:', config);
    const fullConfig = {...this.defaultConfig, ...config};
    const worker = new TestnetWorker(fullConfig);
    await worker.manager.init();
    return worker;
  }

  get provider(): JsonRpcProvider {
    return JsonRpcProvider.from(TestnetWorker.clientConfig);
  }

  async tearDown(): Promise<void> {
    // We are not stopping any server here because we are using Testnet
    return Promise.resolve();
  }

  static get defaultConfig(): Config {
    return {
      homeDir: 'ignored',
      port: 3030,
      rm: false,
      refDir: null,
      ...this.clientConfig,
    };
  }

  private static get clientConfig(): ClientConfig {
    return urlConfigFromNetwork('testnet');
  }
}

export class SandboxWorker extends Worker {
  private server!: SandboxServer;

  static async init(config: Partial<Config>): Promise<SandboxWorker> {
    debug('Lifecycle.SandboxWorker.create()', 'config:', config);
    const syncFilename = SandboxServer.lockfilePath('near-sandbox-worker-sync.txt');
    try {
      fs.accessSync(syncFilename, fs.constants.F_OK);
    } catch {
      debug('catch err in access file:', syncFilename);
      fs.writeFileSync(syncFilename, 'workspace-js test port sync');
    }

    const retryOptions = {
      retries: {
        retries: 100,
        factor: 3,
        minTimeout: 200,
        maxTimeout: 2 * 1000,
        randomize: true,
      },
    };

    // Add file lock in assign port and run near node process
    const release = await lock(syncFilename, retryOptions);
    const defaultConfig = await this.defaultConfig();
    const worker = new SandboxWorker({...defaultConfig, ...config});
    worker.server = await SandboxServer.init(worker.config);
    await worker.server.start();
    // Release file lock after near node start
    await release();
    await worker.manager.init();
    return worker;
  }

  static async defaultConfig(): Promise<Config> {
    const port = await SandboxServer.nextPort();
    return {
      ...this.clientConfig,
      homeDir: SandboxServer.randomHomeDir(),
      port,
      rm: false,
      refDir: null,
      rpcAddr: `http://localhost:${port}`,
    };
  }

  get provider(): JsonRpcProvider {
    return JsonRpcProvider.from(this.rpcAddr);
  }

  async tearDown(): Promise<void> {
    try {
      await this.server.close();
    } catch (error: unknown) {
      debug('this.server.close() threw error.', JSON.stringify(error, null, 2));
    }
  }

  private static get clientConfig(): ClientConfig {
    return {
      network: 'sandbox',
      rootAccountId: 'test.near',
      rpcAddr: '', // Will be over written
      initialBalance: NEAR.parse('100 N').toJSON(),
    };
  }

  private get rpcAddr(): string {
    return `http://localhost:${this.config.port}`;
  }
}
