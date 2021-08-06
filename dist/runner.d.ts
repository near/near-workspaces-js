import { Runtime, TestRunnerFn } from './runtime';
import { Config } from './runtime';
export declare class Runner {
    private config;
    constructor(config: Partial<Config>);
    static create(configOrFunction: TestRunnerFn | Partial<Config>, f?: TestRunnerFn): Promise<Runner>;
    run(fn: TestRunnerFn): Promise<Runtime>;
}
