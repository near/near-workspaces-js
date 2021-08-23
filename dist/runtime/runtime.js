"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SandboxRuntime = exports.TestnetRuntime = exports.Runtime = void 0;
const buffer_1 = require("buffer");
const path_1 = require("path");
const fs_1 = require("fs");
const utils_1 = require("../utils");
const account_manager_1 = require("../account/account-manager");
const provider_1 = require("../provider");
const utils_2 = require("./utils");
const server_1 = require("./server");
const DEFAULT_INITIAL_DEPOSIT = utils_1.toYocto('10');
class Runtime {
    constructor(config, accounts) {
        this.returnedAccounts = new Map();
        this.createdAccounts = {};
        this.config = config;
        if (accounts) {
            this.createdAccounts = accounts;
        }
    }
    static async create(config, fn) {
        switch (config.network) {
            case 'testnet':
                return TestnetRuntime.create(config, fn);
            case 'sandbox':
                return SandboxRuntime.create(config, fn);
            default:
                throw new Error(`config.network = '${config.network}' invalid; ` // eslint-disable-line @typescript-eslint/restrict-template-expressions
                    + 'must be \'testnet\' or \'sandbox\' (the default). Soon \'mainnet\'');
        }
    }
    static async createAndRun(fn, config = {}) {
        const runtime = await Runtime.create(config);
        await runtime.run(fn);
    }
    get accounts() {
        return { root: this.manager.root, ...Object.fromEntries(Object.entries(this.createdAccounts).map(([argName, account]) => [
                argName,
                this.manager.getAccount(account.accountId),
            ])) };
    }
    get homeDir() {
        return this.config.homeDir;
    }
    get init() {
        return this.config.init;
    }
    get root() {
        return this.manager.root;
    }
    isSandbox() {
        return this.config.network === 'sandbox';
    }
    isTestnet() {
        return this.config.network === 'testnet';
    }
    async run(fn) {
        utils_2.debug('About to runtime.run with config', this.config);
        try {
            utils_2.debug('About to call beforeConnect');
            await this.beforeConnect();
            utils_2.debug('About to call connect');
            await this.connect();
            utils_2.debug('About to call afterConnect');
            await this.afterConnect();
            await fn(this.accounts, this);
        }
        catch (error) {
            if (error instanceof Error) {
                utils_2.debug(error.stack);
            }
            throw error; // Figure out better error handling
        }
        finally {
            // Do any needed teardown
            await this.afterRun();
        }
    }
    async createRun(fn) {
        utils_2.debug('About to runtime.createRun with config', this.config);
        try {
            utils_2.debug('About to call beforeConnect');
            await this.beforeConnect();
            utils_2.debug('About to call connect');
            await this.connect();
            utils_2.debug('About to call afterConnect');
            await this.afterConnect();
            const accounts = await fn({ runtime: this, root: this.root });
            this.createdAccounts = { ...this.createdAccounts, ...accounts };
            return accounts;
        }
        catch (error) {
            if (error instanceof buffer_1.Buffer || typeof error === 'string') {
                utils_2.debug(error);
            }
            throw error; // Figure out better error handling
        }
        finally {
            // Do any needed teardown
            await this.afterRun();
        }
    }
    async executeTransaction(fn) {
        return fn();
    }
    async connect() {
        // This.manager = await this.manager.createFrom(this);
    }
}
exports.Runtime = Runtime;
class TestnetRuntime extends Runtime {
    static async create(config, fn) {
        // Add better error handling
        const fullConfig = { ...this.defaultConfig, initFn: fn, ...config };
        // Const accountManager = await AccountManager.create(fullConfig.rootAccount ?? filename, TestnetRuntime.KEYSTORE_PATH, TestnetRuntime);
        utils_2.debug('Skipping initialization function for testnet; will run before each `runner.run`');
        const runtime = new TestnetRuntime(fullConfig);
        runtime.manager = await account_manager_1.AccountManager.create(runtime);
        return runtime;
    }
    async createFrom() {
        const runtime = new TestnetRuntime({ ...this.config, init: false, initFn: this.config.initFn }, this.createdAccounts);
        return runtime;
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
        return {
            network: 'testnet',
            rpcAddr: 'https://rpc.testnet.near.org',
            walletUrl: 'https://wallet.testnet.near.org',
            helperUrl: 'https://helper.testnet.near.org',
            explorerUrl: 'https://explorer.testnet.near.org',
            initialBalance: DEFAULT_INITIAL_DEPOSIT,
        };
    }
    static get provider() {
        return provider_1.JSONRpc.from(this.clientConfig);
    }
    static get baseAccountId() {
        return 'testnet';
    }
    async beforeConnect() {
        // Not needed
    }
    async afterConnect() {
        if (this.config.initFn) {
            utils_2.debug('About to run initFn');
            this.createdAccounts = await this.config.initFn({ runtime: this, root: this.root });
        }
    }
    async afterRun() {
        // Delete accounts created
    }
}
exports.TestnetRuntime = TestnetRuntime;
class SandboxRuntime extends Runtime {
    // Edit genesis.json to add `sandbox` as an account
    static get BASE_ACCOUNT_ID() {
        return 'test.near';
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
    static async create(config, fn) {
        const defaultConfig = await this.defaultConfig();
        const sandbox = new SandboxRuntime({ ...defaultConfig, ...config });
        if (fn) {
            utils_2.debug('Running initialization function to set up sandbox for all future calls to `runner.run`');
            await sandbox.createRun(fn);
        }
        return sandbox;
    }
    async createAndRun(fn, config = {}) {
        await Runtime.createAndRun(fn, config);
    }
    async createFrom() {
        let config = await SandboxRuntime.defaultConfig();
        config = { ...this.config, ...config, init: false, refDir: this.homeDir };
        const runtime = new SandboxRuntime(config, this.createdAccounts);
        runtime.manager = await this.manager.createFrom(runtime);
        return runtime;
    }
    get baseAccountId() {
        return SandboxRuntime.BASE_ACCOUNT_ID;
    }
    static get clientConfig() {
        return {
            network: 'sandbox',
            rootAccount: SandboxRuntime.BASE_ACCOUNT_ID,
            rpcAddr: '',
            initialBalance: utils_1.toYocto('100'),
        };
    }
    get provider() {
        return provider_1.JSONRpc.from(this.rpcAddr);
    }
    get rpcAddr() {
        return `http://localhost:${this.config.port}`;
    }
    async afterConnect() {
        if (this.config.init) {
            await this.root.createAndDeploy('sandbox', SandboxRuntime.LINKDROP_PATH);
            utils_2.debug('Deployed \'sandbox\' linkdrop contract');
        }
    }
    async beforeConnect() {
        if (!(await utils_2.exists(SandboxRuntime.LINKDROP_PATH))) {
            utils_2.debug(`Downloading testnet's linkdrop to ${SandboxRuntime.LINKDROP_PATH}`);
            await fs_1.promises.writeFile(SandboxRuntime.LINKDROP_PATH, await TestnetRuntime.provider.viewCode('testnet')); // eslint-disable-line @typescript-eslint/no-unsafe-call
        }
        this.server = await server_1.SandboxServer.init(this.config);
        await this.server.start();
        if (this.init) {
            this.manager = await account_manager_1.AccountManager.create(this);
        }
    }
    async afterRun() {
        utils_2.debug(`Closing server with port ${this.config.port}`);
        await this.server.close();
    }
}
exports.SandboxRuntime = SandboxRuntime;
SandboxRuntime.LINKDROP_PATH = path_1.join(__dirname, '..', '..', 'core_contracts', 'testnet-linkdrop.wasm');
//# sourceMappingURL=runtime.js.map