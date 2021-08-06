import { Runtime, TestRunnerFn } from './runtime';
import { Config } from './runtime';

export class Runner {
  private config: Partial<Config>;

  constructor(config: Partial<Config>) {
    this.config = config;
  }

  static async create(
    configOrFunction: TestRunnerFn | Partial<Config>,
    f?: TestRunnerFn
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

  async run(fn: TestRunnerFn): Promise<Runtime> {
    const runtime = await Runtime.create(this.config);
    await runtime.run(fn);
    return runtime;
  }
}

function getConfigAndFn(
  configOrFunction: TestRunnerFn | Partial<Config>,
  f?: TestRunnerFn
): { fn: TestRunnerFn, config: Partial<Config> } {
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
