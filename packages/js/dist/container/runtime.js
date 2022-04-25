"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
<<<<<<< HEAD
exports.SandboxWorker = exports.TestnetWorker = exports.Worker = void 0;
=======
exports.SandboxContainer = exports.TestnetContainer = exports.WorkspaceContainer = void 0;
const buffer_1 = require("buffer");
const path_1 = require("path");
>>>>>>> main
const near_units_1 = require("near-units");
const utils_1 = require("../utils");
const account_1 = require("../account");
const jsonrpc_1 = require("../jsonrpc");
const internal_utils_1 = require("../internal-utils");
const server_1 = require("../server/server");
//TODO: move to another file?
class Worker {
    constructor(config) {
        (0, internal_utils_1.debug)('Lifecycle.Worker.constructor', 'config:', config);
        this.config = config;
        this.manager = account_1.AccountManager.create(config);
    }
    static async init(config = {}) {
        var _a;
        (0, internal_utils_1.debug)('Lifecycle.Worker.init()', 'config:', config);
        switch ((_a = config.network) !== null && _a !== void 0 ? _a : (0, utils_1.getNetworkFromEnv)()) {
            case 'testnet':
<<<<<<< HEAD
                return TestnetWorker.init(config);
            case 'sandbox':
                return SandboxWorker.init(config);
=======
                return TestnetContainer.create(config, fn);
            case 'sandbox':
                return SandboxContainer.create(config, fn);
>>>>>>> main
            default:
                throw new Error(`config.network = '${config.network}' invalid; ` // eslint-disable-line @typescript-eslint/restrict-template-expressions
                    + 'must be \'testnet\' or \'sandbox\' (the default). Soon \'mainnet\'');
        }
    }
    get rootAccount() {
        return this.manager.root;
    }
}
<<<<<<< HEAD
exports.Worker = Worker;
class TestnetWorker extends Worker {
    static async init(config) {
        (0, internal_utils_1.debug)('Lifecycle.TestnetWorker.create()', 'config:', config);
        const fullConfig = { ...this.defaultConfig, ...config };
        const runtime = new TestnetWorker(fullConfig);
        await runtime.manager.init();
        return runtime;
    }
    tearDown() {
        // we do not to stop any server here because we are using Testnet
        return Promise.resolve();
=======
exports.WorkspaceContainer = WorkspaceContainer;
class TestnetContainer extends WorkspaceContainer {
    static async create(config, initFn) {
        (0, internal_utils_1.debug)('Lifecycle.TestnetContainer.create()', 'config:', config, 'initFn:', initFn);
        // Add better error handling
        const fullConfig = { ...this.defaultConfig, initFn, ...config };
        (0, internal_utils_1.debug)('Skipping initialization function for testnet; will run before each `worker.fork`');
        const runtime = new TestnetContainer(fullConfig);
        await runtime.manager.init();
        return runtime;
    }
    async clone() {
        (0, internal_utils_1.debug)('Lifecycle.TestnetContainer.clone()');
        const runtime = new TestnetContainer({ ...this.config, init: false, initFn: this.config.initFn }, this.createdAccounts);
        runtime.manager = await this.manager.createFrom(runtime.config);
        return runtime;
>>>>>>> main
    }
    static get defaultConfig() {
        return {
            homeDir: 'ignored',
            port: 3030,
            init: true,
            rm: false,
            refDir: null,
            ...this.clientConfig,
        };
    }
    static get clientConfig() {
        return (0, utils_1.urlConfigFromNetwork)('testnet');
    }
<<<<<<< HEAD
}
exports.TestnetWorker = TestnetWorker;
class SandboxWorker extends Worker {
    static async init(config) {
        (0, internal_utils_1.debug)('Lifecycle.SandboxWorker.create()', 'config:', config);
        const defaultConfig = await this.defaultConfig();
        let worker = new SandboxWorker({ ...defaultConfig, ...config });
        worker.server = await server_1.SandboxServer.init(worker.config);
        await worker.server.start();
        return worker;
    }
    async tearDown() {
        try {
            return await this.server.close();
        }
        catch (error) {
            (0, internal_utils_1.debug)('this.server.close() threw error.', JSON.stringify(error, null, 2));
        }
=======
    static get provider() {
        return jsonrpc_1.JsonRpcProvider.from(this.clientConfig);
    }
    static get baseAccountId() {
        return 'testnet';
    }
    async beforeRun() {
        (0, internal_utils_1.debug)('Lifecycle.TestnetContainer.beforeRun()');
        if (this.config.initFn) {
            this.createdAccounts = await this.config.initFn({ workspace: this, root: this.root });
        }
    }
    async afterRun() {
        (0, internal_utils_1.debug)('Lifecycle.TestnetContainer.afterRun()');
        await this.manager.cleanup();
    }
}
exports.TestnetContainer = TestnetContainer;
class SandboxContainer extends WorkspaceContainer {
    // Edit genesis.json to add `sandbox` as an account
    static get BASE_ACCOUNT_ID() {
        return 'test.near';
>>>>>>> main
    }
    static async defaultConfig() {
        const port = await server_1.SandboxServer.nextPort();
        return {
            ...this.clientConfig,
            homeDir: server_1.SandboxServer.randomHomeDir(),
            port,
            init: true,
            rm: false,
            refDir: null,
            rpcAddr: `http://localhost:${port}`,
        };
    }
<<<<<<< HEAD
    static get clientConfig() {
        return {
            network: 'sandbox',
            rootAccount: "test.near",
=======
    static async create(config, fn) {
        (0, internal_utils_1.debug)('Lifecycle.SandboxContainer.create()', 'config:', config, 'fn:', fn);
        const defaultConfig = await this.defaultConfig();
        const sandbox = new SandboxContainer({ ...defaultConfig, ...config });
        if (fn) {
            await sandbox.createRun(fn);
        }
        return sandbox;
    }
    async createAndRun(fn, config = {}) {
        (0, internal_utils_1.debug)('Lifecycle.SandboxContainer.createAndRun()', 'fn:', fn, 'config:', config);
        await WorkspaceContainer.createAndRun(fn, config);
    }
    async clone() {
        (0, internal_utils_1.debug)('Lifecycle.SandboxContainer.clone()');
        let config = await SandboxContainer.defaultConfig();
        config = { ...this.config, ...config, init: false, refDir: this.homeDir };
        const runtime = new SandboxContainer(config, this.createdAccounts);
        return runtime;
    }
    get baseAccountId() {
        return SandboxContainer.BASE_ACCOUNT_ID;
    }
    static get clientConfig() {
        return {
            network: 'sandbox',
            rootAccount: SandboxContainer.BASE_ACCOUNT_ID,
>>>>>>> main
            rpcAddr: '',
            initialBalance: near_units_1.NEAR.parse('100 N').toJSON(),
        };
    }
    get provider() {
        return jsonrpc_1.JsonRpcProvider.from(this.rpcAddr);
    }
    get rpcAddr() {
        return `http://localhost:${this.config.port}`;
    }
<<<<<<< HEAD
}
exports.SandboxWorker = SandboxWorker;
=======
    async beforeRun() {
        (0, internal_utils_1.debug)('Lifecycle.SandboxContainer.beforeRun()');
        // If (!(await exists(SandboxContainer.LINKDROP_PATH))) {
        //   debug(`Downloading testnet's linkdrop to ${SandboxContainer.LINKDROP_PATH}`);
        //   await fs.writeFile(SandboxContainer.LINKDROP_PATH, await TestnetContainer.provider.viewCode('testnet'));
        // }
        this.server = await server_1.SandboxServer.init(this.config);
        await this.server.start();
        if (this.config.init) {
            await this.manager.init();
            //   Console.log(await this.manager.getKey(this.config.rootAccount!))
            // await this.root.createAndDeploy('sandbox', SandboxContainer.LINKDROP_PATH);
            // debug('Deployed \'sandbox\' linkdrop contract');
        }
    }
    async afterRun() {
        (0, internal_utils_1.debug)('Lifecycle.SandboxContainer.afterRun()');
        try {
            await this.server.close();
        }
        catch (error) {
            (0, internal_utils_1.debug)('this.server.close() threw error.', JSON.stringify(error, null, 2));
        }
    }
}
exports.SandboxContainer = SandboxContainer;
SandboxContainer.LINKDROP_PATH = (0, path_1.join)(__dirname, '..', '..', 'core_contracts', 'testnet-linkdrop.wasm');
>>>>>>> main
//# sourceMappingURL=runtime.js.map