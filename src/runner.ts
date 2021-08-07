import { Runtime, RunnerFn } from './runtime';
import { Config } from './runtime';
import { debug } from './utils';

export class Runner {
  private config: Partial<Config>;

  constructor(config: Partial<Config>) {
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
    const runner = new Runner(config);
    const runtime = await runner.run(fn);
    return new Runner({
      ...config,
      init: false,
      refDir: runtime.config.homeDir
    });
  }

  /**
   * Sets up the context, runs the function, and tears it down.
   * @param fn function to pass runtime to.
   * @returns the runtime used
   */
  async run(fn: RunnerFn): Promise<Runtime> {
    const runtime = await Runtime.create(this.config);
    try {
      // Run any setup before trying to connect to a server
      debug("About to call setup")
      await runtime.setup();
      // Set up connection to node
      debug("About to connect")
      await runtime.connect();
      // Run function
      await fn(runtime);
    } catch (e){
      console.error(e)
      throw e; //TODO Figure out better error handling
    } finally {
      // Do any needed teardown
      await runtime.tearDown();
    }
    return runtime;
  }

  /**
   * Only runs the function if the network is sandbox.
   * @param fn is the function to run
   * @returns 
   */
  async runSandbox(fn: RunnerFn): Promise<Runtime | null> {
    if (this.config.network == "sandbox") {
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
    "Invalid arguments!" +
    "Expected `(config, runFunction)` or just `(runFunction)`"
  )
}
