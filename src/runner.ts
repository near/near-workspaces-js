import process from 'process';
import {Runtime} from './runtime';
import {Config, RunnerFn, CreateRunnerFn} from './interfaces';

export class Runner {
  private runtime?: Runtime;
  private readonly ready: Promise<void>;
  private constructor(runtimePromise: Promise<Runtime>,
  ) {
    this.ready = this.startWaiting(runtimePromise);
  }

  /** Create the initial enviorment for the test to run in.
   * For example create accounts and deploy contracts that future tests will use.
   */
  static create(
    configOrFunction: CreateRunnerFn | Partial<Config>,
    f?: CreateRunnerFn,
  ): Runner {
    const {config, fn} = getConfigAndFn(configOrFunction, f);
    config.network = config.network ?? this.getNetworkFromEnv();
    return new Runner(Runtime.create(config, fn));
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
          `environment variable NEAR_RUNNER_NETWORK=${network} invalid; `
          + 'use \'testnet\' or \'sandbox\' (the default)',
        );
    }
  }

  async startWaiting(runtime: Promise<Runtime>): Promise<void> {
    this.runtime = await runtime;
  }

  /**
   * Sets up the context, runs the function, and tears it down.
   * @param fn function to pass runtime to.
   * @returns the runtime used
   */
  async run(fn: RunnerFn): Promise<Runtime> {
    await this.ready;
    const runtime = await this.runtime!.createFrom();
    await runtime.run(fn);
    return runtime;
  }

  /**
   * Only runs the function if the network is sandbox.
   * @param fn is the function to run
   * @returns
   */
  async runSandbox(fn: RunnerFn): Promise<Runtime | null> {
    await this.ready;
    if (this.runtime!.config.network === 'sandbox') {
      return this.run(fn);
    }

    return null;
  }
}

function getConfigAndFn(
  configOrFunction: CreateRunnerFn | Partial<Config>,
  f?: CreateRunnerFn,
): {fn: CreateRunnerFn; config: Partial<Config>} {
  const type1 = typeof configOrFunction;
  const type2 = typeof f;
  if (type1 === 'function' && type2 === 'undefined') {
    // @ts-expect-error Type this|that not assignable to that
    return {config: {}, fn: configOrFunction};
  }

  if (type1 === 'object' && (type2 === 'function' || type2 === 'undefined')) {
    // @ts-expect-error Type this|that not assignable to that
    return {config: configOrFunction, fn: f};
  }

  throw new Error(
    'Invalid arguments! '
    + 'Expected `(config, runFunction)` or just `(runFunction)`',
  );
}
