"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SandboxRuntime = exports.TestnetRuntime = exports.Runtime = void 0;
const buffer_1 = require("buffer");
const path_1 = require("path");
const os = __importStar(require("os"));
const fs_1 = require("fs");
const nearAPI = __importStar(require("near-api-js"));
const utils_1 = require("../utils");
const utils_2 = require("./utils");
const server_1 = require("./server"); // eslint-disable-line import/no-cycle
const account_1 = require("./account"); // eslint-disable-line import/no-cycle
const DEFAULT_INITIAL_DEPOSIT = utils_1.toYocto('10');
function randomAccountId() {
    // Create random number with at least 7 digits
    const randomNumber = Math.floor((Math.random() * (9999999 - 1000000)) + 1000000);
    const accountId = `dev-${Date.now()}-${randomNumber}`;
    return accountId;
}
async function getKeyFromFile(filePath, create = true) {
    var _a;
    try {
        const keyFile = require(filePath); // eslint-disable-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, unicorn/prefer-module
        return nearAPI.utils.KeyPair.fromString(
        // @ts-expect-error `x` does not exist on KeyFile
        (_a = keyFile.secret_key) !== null && _a !== void 0 ? _a : keyFile.private_key);
    }
    catch (error) {
        if (!create) {
            throw error;
        }
        utils_2.debug('about to write to ', filePath);
        const keyPair = nearAPI.utils.KeyPairEd25519.fromRandom();
        await fs_1.promises.writeFile(filePath, JSON.stringify({
            secret_key: keyPair.toString(),
        }));
        utils_2.debug('wrote to file ', filePath);
        return keyPair;
    }
}
class Runtime {
    constructor(config, accounts) {
        this.accountsCreated = new Map();
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
    get accounts() {
        return { root: this.root, ...Object.fromEntries(Object.entries(this.createdAccounts).map(([argName, account]) => [
                argName,
                this.root.getAccount(account.prefix),
            ])) };
    }
    get homeDir() {
        return this.config.homeDir;
    }
    get init() {
        return this.config.init;
    }
    get rpcAddr() {
        return this.config.rpcAddr;
    }
    get network() {
        return this.config.network;
    }
    get masterAccount() {
        return this.config.masterAccount;
    }
    async getMasterKey() {
        utils_2.debug('reading key from file', this.keyFilePath);
        return getKeyFromFile(this.keyFilePath);
    }
    async connect() {
        this.near = await nearAPI.connect({
            deps: {
                keyStore: this.keyStore,
            },
            keyPath: this.keyFilePath,
            networkId: this.config.network,
            nodeUrl: this.rpcAddr,
            walletUrl: this.config.walletUrl,
            masterAccount: this.config.masterAccount,
            initialBalance: this.config.initialBalance,
        });
        this.root = new account_1.Account(this.masterAccount, this);
    }
    async run(fn, args) {
        utils_2.debug('About to runtime.run with config', this.config);
        try {
            this.keyStore = await this.getKeyStore();
            utils_2.debug('About to call beforeConnect');
            await this.beforeConnect();
            utils_2.debug('About to call connect');
            await this.connect();
            utils_2.debug('About to call afterConnect');
            await this.afterConnect();
            if (args) {
                utils_2.debug(`Passing ${Object.getOwnPropertyNames(args).join(', ')}`);
            }
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
            this.keyStore = await this.getKeyStore();
            utils_2.debug('About to call beforeConnect');
            await this.beforeConnect();
            utils_2.debug('About to call connect');
            await this.connect();
            utils_2.debug('About to call afterConnect');
            await this.afterConnect();
            const accounts = await fn({ runtime: this, root: this.getRoot() });
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
    getRoot() {
        return this.root;
    }
    isSandbox() {
        return this.config.network === 'sandbox';
    }
    isTestnet() {
        return this.config.network === 'testnet';
    }
    async executeTransaction(fn) {
        return fn();
    }
    addAccountCreated(accountId, sender) {
        const short = accountId.replace(`.${sender.accountId}`, '');
        this.accountsCreated.set(accountId, short);
    }
    async addMasterAccountKey() {
        const mainKey = await this.getMasterKey();
        await this.keyStore.setKey(this.config.network, this.masterAccount, mainKey);
    }
}
exports.Runtime = Runtime;
class TestnetRuntime extends Runtime {
    static async create(config, fn) {
        utils_2.debug('Skipping initialization function for testnet; will run before each `runner.run`');
        return new TestnetRuntime({ ...this.defaultConfig, initFn: fn, ...config });
    }
    static get defaultConfig() {
        return {
            homeDir: 'ignored',
            port: 3030,
            init: true,
            rm: false,
            refDir: null,
            network: 'testnet',
            rpcAddr: 'https://rpc.testnet.near.org',
            walletUrl: 'https://wallet.testnet.near.org',
            helperUrl: 'https://helper.testnet.near.org',
            explorerUrl: 'https://explorer.testnet.near.org',
            initialBalance: DEFAULT_INITIAL_DEPOSIT,
        };
    }
    static get provider() {
        return new nearAPI.providers.JsonRpcProvider(this.defaultConfig.rpcAddr);
    }
    /**
     * Get most recent Wasm Binary of given account.
     * */
    static async viewCode(account_id) {
        const result = await this.provider.query({
            request_type: 'view_code',
            finality: 'final',
            account_id,
        });
        return buffer_1.Buffer.from(result.code_base64, 'base64'); // eslint-disable-line @typescript-eslint/no-unsafe-member-access
    }
    async createFrom() {
        return new TestnetRuntime({ ...this.config, init: false, initFn: this.config.initFn }, this.createdAccounts);
    }
    get baseAccountId() {
        return 'testnet';
    }
    get keyFilePath() {
        return path_1.join(os.homedir(), '.near-credentials', `${this.network}`, `${this.masterAccount}.json`);
    }
    async getKeyStore() {
        const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(path_1.join(os.homedir(), '.near-credentials'));
        return keyStore;
    }
    async beforeConnect() {
        await this.ensureKeyFileFolder();
        const accountCreator = new nearAPI.accountCreator.UrlAccountCreator({}, // ignored
        this.config.helperUrl);
        if (!this.config.masterAccount) {
            // Create new `dev-deploy`-style account (or reuse existing)
            this.config.masterAccount = randomAccountId();
        }
        await this.addMasterAccountKey();
        await accountCreator.createAccount(this.masterAccount, (await this.getMasterKey()).getPublicKey());
        utils_2.debug(`Added masterAccount ${this.config.masterAccount} with keyStore ${JSON.stringify(this.keyStore)} and publicKey ${(await this.keyStore.getKey(this.config.network, this.masterAccount)).getPublicKey().toString()}
      https://explorer.testnet.near.org/accounts/${this.masterAccount}`);
    }
    async afterConnect() {
        if (this.config.initFn) {
            utils_2.debug('About to run initFn');
            this.createdAccounts = await this.config.initFn({ runtime: this, root: this.getRoot() });
        }
    }
    async afterRun() {
        // Delete accounts created
    }
    async ensureKeyFileFolder() {
        const keyFolder = path_1.dirname(this.keyFilePath);
        try {
            await fs_1.promises.mkdir(keyFolder, { recursive: true });
        }
        catch {
            // Check error
        }
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
            homeDir: server_1.SandboxServer.randomHomeDir(),
            port,
            init: true,
            rm: false,
            refDir: null,
            network: 'sandbox',
            masterAccount: SandboxRuntime.BASE_ACCOUNT_ID,
            rpcAddr: `http://localhost:${port}`,
            initialBalance: utils_1.toYocto('100'),
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
    async createFrom() {
        const config = await SandboxRuntime.defaultConfig();
        return new SandboxRuntime({ ...config, init: false, refDir: this.homeDir }, this.createdAccounts);
    }
    get baseAccountId() {
        return SandboxRuntime.BASE_ACCOUNT_ID;
    }
    get keyFilePath() {
        return path_1.join(this.homeDir, 'validator_key.json');
    }
    async getKeyStore() {
        const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(this.homeDir);
        return keyStore;
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
            await fs_1.promises.writeFile(SandboxRuntime.LINKDROP_PATH, await TestnetRuntime.viewCode('testnet'));
        }
        this.server = await server_1.SandboxServer.init(this.config);
        if (this.init) {
            await this.addMasterAccountKey();
        }
        await this.server.start();
    }
    async afterRun() {
        utils_2.debug(`Closing server with port ${this.config.port}`);
        await this.server.close();
    }
}
exports.SandboxRuntime = SandboxRuntime;
SandboxRuntime.LINKDROP_PATH = path_1.join(__dirname, '..', '..', 'core_contracts', 'testnet-linkdrop.wasm'); // eslint-disable-line unicorn/prefer-module
//# sourceMappingURL=runtime.js.map