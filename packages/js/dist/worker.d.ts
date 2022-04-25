import { NearAccount, NearAccountManager } from './account';
import { Config } from './interfaces';
import { JsonRpcProvider } from './jsonrpc';
export declare abstract class Worker {
    protected config: Config;
    protected manager: NearAccountManager;
    constructor(config: Config);
    static init(config?: Partial<Config>): Promise<Worker>;
    get rootAccount(): NearAccount;
    abstract get provider(): JsonRpcProvider;
    abstract tearDown(): Promise<void>;
}
export declare class TestnetWorker extends Worker {
    static init(config: Partial<Config>): Promise<TestnetWorker>;
    get provider(): JsonRpcProvider;
    tearDown(): Promise<void>;
    static get defaultConfig(): Config;
    private static get clientConfig();
}
export declare class SandboxWorker extends Worker {
    private server;
    static init(config: Partial<Config>): Promise<SandboxWorker>;
    static defaultConfig(): Promise<Config>;
    get provider(): JsonRpcProvider;
    tearDown(): Promise<void>;
    private static get clientConfig();
    private get rpcAddr();
}
//# sourceMappingURL=worker.d.ts.map