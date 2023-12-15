import { Config } from './types';
import { NearAccount, NearAccountManager } from './account';
import { JsonRpcProvider } from './jsonrpc';
/**
 * The main interface to near-workspaces. Create a new worker instance with {@link Worker.init}, then run code on it.
 */
export declare abstract class Worker {
    protected config: Config;
    protected manager: NearAccountManager;
    constructor(config: Config);
    /**
     * Initialize a new worker.
     *
     * In local sandbox mode, this will:
     *   - Create a new local blockchain
     *   - Load the root account for that blockchain, available as `root`:
     *
     * In testnet mode, the same functionality is achieved via different means:
     * creating a new account as the `root`.
     * Since all actions must occur on one blockchain instead of N.
     *
     * @param config a configuration object
     * @returns an instance of the Worker class
     */
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