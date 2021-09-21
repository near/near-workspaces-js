import { Runtime } from './runtime';
import { Config, RunnerFn, CreateRunnerFn } from './interfaces';
export declare class Runner {
    private runtime?;
    private readonly ready;
    protected constructor(runtimePromise: Promise<Runtime>);
    /** Create the initial enviorment for the test to run in.
     * For example create accounts and deploy contracts that future tests will use.
     */
    static create(configOrFunction: CreateRunnerFn | Partial<Config>, f?: CreateRunnerFn): Runner;
    static networkIsTestnet(): boolean;
    static networkIsSandbox(): boolean;
    static getNetworkFromEnv(): 'sandbox' | 'testnet';
    startWaiting(runtime: Promise<Runtime>): Promise<void>;
    /**
     * Sets up the context, runs the function, and tears it down.
     * @param fn function to pass runtime to.
     * @returns the runtime used
     */
    run(fn: RunnerFn): Promise<Runtime>;
    /**
     * Only runs the function if the network is sandbox.
     * @param fn is the function to run
     * @returns
     */
    runSandbox(fn: RunnerFn): Promise<Runtime | null>;
}
