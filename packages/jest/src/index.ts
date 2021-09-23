import {CreateRunnerFn, Config, RunnerFn, Runner as RawRunner} from 'near-runner';

export * from 'near-runner';

export declare interface Runner extends RawRunner {
  test(description: string, fn: RunnerFn): void;
}

export class Runner extends RawRunner {
  static create(
    configOrFunction: CreateRunnerFn | Partial<Config>,
    f?: CreateRunnerFn,
  ): Runner {
    const runner = RawRunner.create(configOrFunction, f);

    (runner as Runner).test = (description: string, fn: RunnerFn): void => {
      test(description, async () => {
        await runner.run(fn);
      });
    };

    return runner as Runner;
  }
}

