import {CreateRunnerFn, Config, Runner as RawRunner, AccountArgs, NearRuntime} from 'near-runner';
import * as ava from 'ava'; // eslint-disable-line ava/use-test
import test from 'ava'; // eslint-disable-line @typescript-eslint/no-duplicate-imports

export * from 'near-runner';
export {test as ava};

export type AvaRunnerFn = (t: ava.ExecutionContext, args: AccountArgs, runtime: NearRuntime) => Promise<void>;

export declare interface Runner extends RawRunner {
  test(description: string, fn: AvaRunnerFn): void;
}

export class Runner extends RawRunner {
  static create(
    configOrFunction: CreateRunnerFn | Partial<Config>,
    f?: CreateRunnerFn,
  ): Runner {
    const runner = RawRunner.create(configOrFunction, f);

    (runner as Runner).test = (description: string, fn: AvaRunnerFn): void => {
      test(description, async t => {
        await runner.run(async (args, runtime) => fn(t, args, runtime));
      });
    };

    return runner as Runner;
  }
}

