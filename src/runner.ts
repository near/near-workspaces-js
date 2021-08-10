import { Runtime, RunnerFn } from './runtime';
import { Config } from './runtime';
import { debug } from './utils';

export class Runner {
  private config: Partial<Config>;

  private constructor(config: Partial<Config>) {
    this.config = config;
  }

  /** Create the initial enviorment for the test to run in.
   * For example create accounts and deploy contracts that future tests will use.
   */
  static async create(
    configOrFunction: RunnerFn | Partial<Config>,
    f?: RunnerFn
  ): Promise<Runner> {
    const { config, fn } = getConfigAndFn(configOrFunction, f);
    config.network = config.network || this.getNetworkFromEnv();
    const runtime = await Runtime.create(config, fn);
    return new Runner({
      ...config,
      init: false,
      refDir: runtime.config.homeDir,
      initFn: fn
    });
  }

  static getNetworkFromEnv(): 'sandbox' | 'testnet' {
    const network = process.env.NEAR_RUNNER_NETWORK;
    switch (network) {
      case 'sandbox':
      case 'testnet':
        return network;
      case undefined:
        return 'sandbox';
      default:
        throw new Error(
          `environment variable NEAR_RUNNER_NETWORK=${network} invalid; ` +
          "use 'testnet' or 'sandbox' (the default)"
        );
    }
  }


  /**
   * Sets up the context, runs the function, and tears it down.
   * @param fn function to pass runtime to.
   * @returns the runtime used
   */
  async run(fn: RunnerFn): Promise<Runtime> {
    const runtime = await Runtime.create(this.config);
    await runtime.run(fn);
    return runtime;
  }

  /**
   * Only runs the function if the network is sandbox.
   * @param fn is the function to run
   * @returns
   */
  async runSandbox(fn: RunnerFn): Promise<Runtime | null> {
    if ('sandbox' === this.config.network) {
      return this.run(fn);
    }
    return null;
  }
}

function getConfigAndFn(
  configOrFunction: RunnerFn | Partial<Config>,
  f?: RunnerFn
): { fn: RunnerFn, config: Partial<Config> } {
  const type1 = typeof configOrFunction;
  const type2 = typeof f;
  if (type1 === 'function' && type2 === 'undefined') {
    // @ts-ignore Type this|that not assignable to that
    return { config: {}, fn: configOrFunction };
  }
  if (type1 === 'object' && type2 === 'function') {
    // @ts-ignore Type this|that not assignable to that
    return { config: configOrFunction, fn: f };
  }
  throw new Error(
    "Invalid arguments! " +
    "Expected `(config, runFunction)` or just `(runFunction)`"
  )
}
