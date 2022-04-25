import { ClientConfig, FinalExecutionOutcome } from '../types';
import { NearAccount, NearAccountManager } from '../account';
import { AccountArgs, Config, InitWorkspaceFn, ReturnedAccounts, WorkspaceFn } from '../interfaces';
import { JsonRpcProvider } from '../jsonrpc';
declare type AccountShortName = string;
declare type AccountId = string;
export declare abstract class WorkspaceContainer {
    config: Config;
    returnedAccounts: Map<AccountId, AccountShortName>;
    protected manager: NearAccountManager;
    protected createdAccounts: ReturnedAccounts;
    constructor(config: Config, accounts?: ReturnedAccounts);
    static create(config: Partial<Config>, fn?: InitWorkspaceFn): Promise<WorkspaceContainer>;
    static createAndRun(fn: WorkspaceFn, config?: Partial<Config>): Promise<void>;
    protected get accounts(): AccountArgs;
    protected get homeDir(): string;
    protected get init(): boolean;
    protected get root(): NearAccount;
    isSandbox(): boolean;
    isTestnet(): boolean;
    fork(fn: WorkspaceFn): Promise<void>;
    createRun(fn: InitWorkspaceFn): Promise<ReturnedAccounts>;
    executeTransaction(fn: () => Promise<FinalExecutionOutcome>): Promise<FinalExecutionOutcome>;
    abstract clone(): Promise<WorkspaceContainer>;
    protected abstract beforeRun(): Promise<void>;
    protected abstract afterRun(): Promise<void>;
}
export declare class TestnetContainer extends WorkspaceContainer {
    static create(config: Partial<Config>, initFn?: InitWorkspaceFn): Promise<TestnetContainer>;
    clone(): Promise<TestnetContainer>;
    static get defaultConfig(): Config;
    static get clientConfig(): ClientConfig;
    static get provider(): JsonRpcProvider;
    static get baseAccountId(): string;
    beforeRun(): Promise<void>;
    afterRun(): Promise<void>;
}
export declare class SandboxContainer extends WorkspaceContainer {
    private static readonly LINKDROP_PATH;
    private static get BASE_ACCOUNT_ID();
    private server;
    static defaultConfig(): Promise<Config>;
    static create(config: Partial<Config>, fn?: InitWorkspaceFn): Promise<SandboxContainer>;
    createAndRun(fn: WorkspaceFn, config?: Partial<Config>): Promise<void>;
    clone(): Promise<SandboxContainer>;
    get baseAccountId(): string;
    static get clientConfig(): ClientConfig;
    get provider(): JsonRpcProvider;
    get rpcAddr(): string;
    beforeRun(): Promise<void>;
    afterRun(): Promise<void>;
}
export {};
//# sourceMappingURL=container.d.ts.map