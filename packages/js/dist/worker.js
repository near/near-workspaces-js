"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SandboxWorker = exports.TestnetWorker = exports.Worker = void 0;
const near_units_1 = require("near-units");
const utils_1 = require("./utils");
const account_1 = require("./account");
const jsonrpc_1 = require("./jsonrpc");
const internal_utils_1 = require("./internal-utils");
const server_1 = require("./server/server");
/**
 * The main interface to near-workspaces. Create a new worker instance with {@link Worker.init}, then run code on it.
 */
class Worker {
    constructor(config) {
        (0, internal_utils_1.debug)('Lifecycle.Worker.constructor', 'config:', config);
        this.config = config;
        this.manager = account_1.AccountManager.create(config);
    }
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
    static async init(config = {}) {
        var _a;
        (0, internal_utils_1.debug)('Lifecycle.Worker.init()', 'config:', config);
        switch ((_a = config.network) !== null && _a !== void 0 ? _a : (0, utils_1.getNetworkFromEnv)()) {
            case 'testnet':
                return TestnetWorker.init(config);
            case 'sandbox':
                return SandboxWorker.init(config);
            default:
                throw new Error(`config.network = '${config.network}' invalid; ` // eslint-disable-line @typescript-eslint/restrict-template-expressions
                    + 'must be \'testnet\' or \'sandbox\' (the default). Soon \'mainnet\'');
        }
    }
    get rootAccount() {
        return this.manager.root;
    }
}
exports.Worker = Worker;
class TestnetWorker extends Worker {
    static async init(config) {
        (0, internal_utils_1.debug)('Lifecycle.TestnetWorker.create()', 'config:', config);
        const fullConfig = { ...this.defaultConfig, ...config };
        const worker = new TestnetWorker(fullConfig);
        await worker.manager.init();
        return worker;
    }
    get provider() {
        return jsonrpc_1.JsonRpcProvider.from(TestnetWorker.clientConfig);
    }
    async tearDown() {
        // We are not stoping any server here because we are using Testnet
        return Promise.resolve();
    }
    static get defaultConfig() {
        return {
            homeDir: 'ignored',
            port: 3030,
            rm: false,
            refDir: null,
            ...this.clientConfig,
        };
    }
    static get clientConfig() {
        return (0, utils_1.urlConfigFromNetwork)('testnet');
    }
}
exports.TestnetWorker = TestnetWorker;
class SandboxWorker extends Worker {
    static async init(config) {
        (0, internal_utils_1.debug)('Lifecycle.SandboxWorker.create()', 'config:', config);
        const defaultConfig = await this.defaultConfig();
        const worker = new SandboxWorker({ ...defaultConfig, ...config });
        worker.server = await server_1.SandboxServer.init(worker.config);
        await worker.server.start();
        await worker.manager.init();
        return worker;
    }
    static async defaultConfig() {
        const port = await server_1.SandboxServer.nextPort();
        return {
            ...this.clientConfig,
            homeDir: server_1.SandboxServer.randomHomeDir(),
            port,
            rm: false,
            refDir: null,
            rpcAddr: `http://localhost:${port}`,
        };
    }
    get provider() {
        return jsonrpc_1.JsonRpcProvider.from(this.rpcAddr);
    }
    async tearDown() {
        try {
            await this.server.close();
        }
        catch (error) {
            (0, internal_utils_1.debug)('this.server.close() threw error.', JSON.stringify(error, null, 2));
        }
    }
    static get clientConfig() {
        return {
            network: 'sandbox',
            rootAccountId: 'test.near',
            rpcAddr: '',
            initialBalance: near_units_1.NEAR.parse('100 N').toJSON(),
        };
    }
    get rpcAddr() {
        return `http://localhost:${this.config.port}`;
    }
}
exports.SandboxWorker = SandboxWorker;
//# sourceMappingURL=worker.js.map