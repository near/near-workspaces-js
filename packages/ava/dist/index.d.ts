import { CreateRunnerFn, Config, Runner as RawRunner, AccountArgs, NearRuntime } from 'near-runner';
import * as ava from 'ava';
import test from 'ava';
export * from 'near-runner';
export { test as ava };
export declare type AvaRunnerFn = (t: ava.ExecutionContext, args: AccountArgs, runtime: NearRuntime) => Promise<void>;
export declare interface Runner extends RawRunner {
    test(description: string, fn: AvaRunnerFn): void;
}
export declare class Runner extends RawRunner {
    static create(configOrFunction: CreateRunnerFn | Partial<Config>, f?: CreateRunnerFn): Runner;
}
