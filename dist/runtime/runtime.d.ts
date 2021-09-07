import { ClientConfig, FinalExecutionOutcome } from '../types';
import { NearAccount, NearAccountManager } from '../account';
import { AccountArgs, Config, CreateRunnerFn, ReturnedAccounts, RunnerFn } from '../interfaces';
import { JsonRpcProvider } from '../jsonrpc';
declare type AccountShortName = string;
declare type AccountId = string;
export declare abstract class Runtime {
    config: Config;
    returnedAccounts: Map<AccountId, AccountShortName>;
    protected manager: NearAccountManager;
    protected createdAccounts: ReturnedAccounts;
    constructor(config: Config, accounts?: ReturnedAccounts);
    static create(config: Partial<Config>, fn?: CreateRunnerFn): Promise<Runtime>;
    static createAndRun(fn: RunnerFn, config?: Partial<Config>): Promise<void>;
    protected get accounts(): AccountArgs;
    protected get homeDir(): string;
    protected get init(): boolean;
    protected get root(): NearAccount;
    isSandbox(): boolean;
    isTestnet(): boolean;
    run(fn: RunnerFn): Promise<void>;
    createRun(fn: CreateRunnerFn): Promise<ReturnedAccounts>;
    executeTransaction(fn: () => Promise<FinalExecutionOutcome>): Promise<FinalExecutionOutcome>;
    abstract createFrom(): Promise<Runtime>;
    protected abstract beforeRun(): Promise<void>;
    protected abstract afterRun(): Promise<void>;
}
export declare class TestnetRuntime extends Runtime {
    static create(config: Partial<Config>, initFn?: CreateRunnerFn): Promise<TestnetRuntime>;
    createFrom(): Promise<TestnetRuntime>;
    static get defaultConfig(): Config;
    static get clientConfig(): ClientConfig;
    static get provider(): JsonRpcProvider;
    static get baseAccountId(): string;
    beforeRun(): Promise<void>;
    afterRun(): Promise<void>;
}
export declare class SandboxRuntime extends Runtime {
    private static readonly LINKDROP_PATH;
    private static get BASE_ACCOUNT_ID();
    private server;
    static defaultConfig(): Promise<Config>;
    static create(config: Partial<Config>, fn?: CreateRunnerFn): Promise<SandboxRuntime>;
    createAndRun(fn: RunnerFn, config?: Partial<Config>): Promise<void>;
    createFrom(): Promise<SandboxRuntime>;
    get baseAccountId(): string;
    static get clientConfig(): ClientConfig;
    get provider(): JsonRpcProvider;
    get rpcAddr(): string;
    beforeRun(): Promise<void>;
    afterRun(): Promise<void>;
}
export {};
