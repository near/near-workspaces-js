import { FinalExecutionOutcome } from '../types';
import { NearAccount, NearAccountManager } from '../account';
import { AccountArgs, ClientConfig, Config, CreateRunnerFn, ReturnedAccounts, RunnerFn } from '../interfaces';
import { JSONRpc } from '../jsonrpc';
declare type AccountShortName = string;
declare type AccountId = string;
declare type UserPropName = string;
declare type SerializedReturnedAccounts = Map<UserPropName, AccountShortName>;
export declare abstract class Runtime {
    config: Config;
    returnedAccounts: Map<AccountId, AccountShortName>;
    resultArgs?: SerializedReturnedAccounts;
    protected manager: NearAccountManager;
    protected createdAccounts: ReturnedAccounts;
    constructor(config: Config, accounts?: ReturnedAccounts);
    static create(config: Partial<Config>, fn?: CreateRunnerFn): Promise<Runtime>;
    static createAndRun(fn: RunnerFn, config?: Partial<Config>): Promise<void>;
    get accounts(): AccountArgs;
    get homeDir(): string;
    get init(): boolean;
    get root(): NearAccount;
    isSandbox(): boolean;
    isTestnet(): boolean;
    run(fn: RunnerFn): Promise<void>;
    createRun(fn: CreateRunnerFn): Promise<ReturnedAccounts>;
    executeTransaction(fn: () => Promise<FinalExecutionOutcome>): Promise<FinalExecutionOutcome>;
    protected connect(): Promise<void>;
    abstract createFrom(): Promise<Runtime>;
    protected abstract beforeConnect(): Promise<void>;
    protected abstract afterConnect(): Promise<void>;
    protected abstract afterRun(): Promise<void>;
}
export declare class TestnetRuntime extends Runtime {
    static create(config: Partial<Config>, fn?: CreateRunnerFn): Promise<TestnetRuntime>;
    createFrom(): Promise<TestnetRuntime>;
    static get defaultConfig(): Config;
    static get clientConfig(): ClientConfig;
    static get provider(): JSONRpc;
    static get baseAccountId(): string;
    beforeConnect(): Promise<void>;
    afterConnect(): Promise<void>;
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
    get provider(): JSONRpc;
    get rpcAddr(): string;
    afterConnect(): Promise<void>;
    beforeConnect(): Promise<void>;
    afterRun(): Promise<void>;
}
export {};
