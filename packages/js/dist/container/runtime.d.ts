import { ClientConfig } from '../types';
import { NearAccount, NearAccountManager } from '../account';
import { Config } from '../interfaces';
import { JsonRpcProvider } from '../jsonrpc';
export declare abstract class Worker {
    config: Config;
    protected manager: NearAccountManager;
<<<<<<< HEAD
    constructor(config: Config);
    static init(config?: Partial<Config>): Promise<Worker>;
    get rootAccount(): NearAccount;
    abstract tearDown(): Promise<void>;
}
export declare class TestnetWorker extends Worker {
    static init(config: Partial<Config>): Promise<TestnetWorker>;
    tearDown(): Promise<void>;
=======
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
>>>>>>> main
    static get defaultConfig(): Config;
    static get clientConfig(): ClientConfig;
}
<<<<<<< HEAD
export declare class SandboxWorker extends Worker {
=======
export declare class SandboxContainer extends WorkspaceContainer {
    private static readonly LINKDROP_PATH;
    private static get BASE_ACCOUNT_ID();
>>>>>>> main
    private server;
    static init(config: Partial<Config>): Promise<SandboxWorker>;
    tearDown(): Promise<void>;
    static defaultConfig(): Promise<Config>;
<<<<<<< HEAD
=======
    static create(config: Partial<Config>, fn?: InitWorkspaceFn): Promise<SandboxContainer>;
    createAndRun(fn: WorkspaceFn, config?: Partial<Config>): Promise<void>;
    clone(): Promise<SandboxContainer>;
    get baseAccountId(): string;
>>>>>>> main
    static get clientConfig(): ClientConfig;
    get provider(): JsonRpcProvider;
    get rpcAddr(): string;
}
//# sourceMappingURL=runtime.d.ts.map