import { CreateRunnerFn, Config, RunnerFn, Runner as RawRunner } from 'near-runner';
export * from 'near-runner';
export declare interface Runner extends RawRunner {
    test(description: string, fn: RunnerFn): void;
}
export declare class Runner extends RawRunner {
    static create(configOrFunction: CreateRunnerFn | Partial<Config>, f?: CreateRunnerFn): Runner;
}
