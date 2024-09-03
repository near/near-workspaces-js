"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SandboxWorker = exports.TestnetWorker = exports.CustomnetWorker = exports.Worker = void 0;
const fs_1 = __importDefault(require("fs"));
const near_units_1 = require("near-units");
const proper_lockfile_1 = require("proper-lockfile");
const utils_1 = require("./utils");
const account_1 = require("./account");
const jsonrpc_1 = require("./jsonrpc");
const internal_utils_1 = require("./internal-utils");
const server_1 = require("./server/server");
const API_KEY_HEADER = 'x-api-key';
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
            case 'custom':
                return CustomnetWorker.init(config);
            default:
                throw new Error(`config.network = '${config.network}' invalid; ` // eslint-disable-line @typescript-eslint/restrict-template-expressions
                    + 'must be \'testnet\', \'sandbox\' or \'custom\' (the default). Soon \'mainnet\'');
        }
    }
    get rootAccount() {
        return this.manager.root;
    }
}
exports.Worker = Worker;
// Connect to a custom network.
// Note: the burden of ensuring the methods that are able to be called are left up to the user.
class CustomnetWorker extends Worker {
    constructor() {
        super(...arguments);
        this.clientConfig = (0, utils_1.urlConfigFromNetwork)({ network: 'custom', rpcAddr: this.config.rpcAddr });
    }
    static async init(config) {
        (0, internal_utils_1.debug)('Lifecycle.CustomnetWorker.create()', 'config:', config);
        const fullConfig = {
            homeDir: 'ignored',
            port: 3030,
            rm: false,
            refDir: null,
            ...(0, utils_1.urlConfigFromNetwork)({ network: 'custom', rpcAddr: config.rpcAddr }),
            ...config,
        };
        const worker = new CustomnetWorker(fullConfig);
        if (config.apiKey) {
            worker.provider.connection.headers = {
                ...worker.provider.connection.headers, [API_KEY_HEADER]: config.apiKey,
            };
        }
        await worker.manager.init();
        return worker;
    }
    get provider() {
        return jsonrpc_1.JsonRpcProvider.from(this.clientConfig);
    }
    async tearDown() {
        // We are not stopping any server here because it is an external network.
        return Promise.resolve();
    }
    get defaultConfig() {
        return {
            homeDir: 'ignored',
            port: 3030,
            rm: false,
            refDir: null,
            ...this.clientConfig,
        };
    }
}
exports.CustomnetWorker = CustomnetWorker;
class TestnetWorker extends Worker {
    static async init(config) {
        (0, internal_utils_1.debug)('Lifecycle.TestnetWorker.create()', 'config:', config);
        const fullConfig = { ...this.defaultConfig, ...config };
        const worker = new TestnetWorker(fullConfig);
        if (config.apiKey) {
            worker.provider.connection.headers = {
                ...worker.provider.connection.headers, [API_KEY_HEADER]: config.apiKey,
            };
        }
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
        const syncFilename = server_1.SandboxServer.lockfilePath('near-sandbox-worker-sync.txt');
        try {
            fs_1.default.accessSync(syncFilename, fs_1.default.constants.F_OK);
        }
        catch {
            (0, internal_utils_1.debug)('catch err in access file:', syncFilename);
            fs_1.default.writeFileSync(syncFilename, 'workspace-js test port sync');
        }
        const retryOptions = {
            retries: {
                retries: 100,
                factor: 3,
                minTimeout: 200,
                maxTimeout: 2 * 1000,
                randomize: true,
            },
        };
        // Add file lock in assign port and run near node process
        const release = await (0, proper_lockfile_1.lock)(syncFilename, retryOptions);
        const defaultConfig = await this.defaultConfig();
        const worker = new SandboxWorker({ ...defaultConfig, ...config });
        if (config.apiKey) {
            worker.provider.connection.headers = {
                ...worker.provider.connection.headers, [API_KEY_HEADER]: config.apiKey,
            };
        }
        worker.server = await server_1.SandboxServer.init(worker.config);
        await worker.server.start();
        // Release file lock after near node start
        await release();
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
            rpcAddr: `http://127.0.0.1:${port}`,
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
        return `http://127.0.0.1:${this.config.port}`;
    }
}
exports.SandboxWorker = SandboxWorker;
//# sourceMappingURL=worker.js.map