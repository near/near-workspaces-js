import { Runtime, RunnerFn, CreateRunnerFn, Config } from './runtime';

export class Runner {
  private constructor(
    private config: Partial<Config>,
    private args?: any
  ) { /* auto-assigns to this.config & this.args */ }

  /** Create the initial enviorment for the test to run in.
   * For example create accounts and deploy contracts that future tests will use.
   */
  static async create(
    configOrFunction: CreateRunnerFn | Partial<Config>,
    f?: CreateRunnerFn
  ): Promise<Runner> {
    const { config, fn } = getConfigAndFn(configOrFunction, f);
    config.network = config.network || this.getNetworkFromEnv();
    const runtime = await Runtime.create(config, fn);
    return new Runner({
      ...config,
      init: false,
      refDir: runtime.config.homeDir,
      initFn: fn
    }, runtime.resultArgs);
  }

  static networkIsTestnet(): boolean {
    return this.getNetworkFromEnv() === 'testnet';
  }

  static networkIsSandbox(): boolean {
    return this.getNetworkFromEnv() === 'sandbox';
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
    await runtime.run(fn, this.args);
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
  configOrFunction: CreateRunnerFn | Partial<Config>,
  f?: CreateRunnerFn
): { fn: CreateRunnerFn, config: Partial<Config> } {
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
