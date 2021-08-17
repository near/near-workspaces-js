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
const fs_1 = require("fs");
const nearAPI = __importStar(require("near-api-js"));
const path_1 = require("path");
const os = __importStar(require("os"));
const account_1 = require("./account");
const server_1 = require("./server");
const utils_1 = require("./utils");
const utils_2 = require("../utils");
const DEFAULT_INITIAL_DEPOSIT = utils_2.toYocto("10");
function randomAccountId() {
    let accountId;
    // create random number with at least 7 digits
    const randomNumber = Math.floor(Math.random() * (9999999 - 1000000) + 1000000);
    accountId = `dev-${Date.now()}-${randomNumber}`;
    return accountId;
}
async function getKeyFromFile(filePath, create = true) {
    try {
        const keyFile = require(filePath);
        return nearAPI.utils.KeyPair.fromString(keyFile.secret_key || keyFile.private_key);
    }
    catch (e) {
        if (!create)
            throw e;
        utils_1.debug("about to write to ", filePath);
        const keyPair = nearAPI.utils.KeyPairEd25519.fromRandom();
        await fs_1.promises.writeFile(filePath, JSON.stringify({
            secret_key: keyPair.toString()
        }));
        utils_1.debug("wrote to file ", filePath);
        return keyPair;
    }
}
class Runtime {
    constructor(config, accounts) {
        this.createdAccounts = {};
        this.accountsCreated = new Map();
        this.config = config;
        if (accounts) {
            this.createdAccounts = accounts;
        }
    }
    static async create(config, fn) {
        switch (config.network) {
            case "testnet":
                return TestnetRuntime.create(config, fn);
            case "sandbox":
                return SandboxRuntime.create(config, fn);
            default:
                throw new Error(`config.network = '${config.network}' invalid; ` +
                    "must be 'testnet' or 'sandbox' (the default). Soon 'mainnet'");
        }
    }
    get accounts() {
        return { ...{ root: this.root }, ...Object.fromEntries(Object.entries(this.createdAccounts).map(([argName, account]) => {
                return [
                    argName,
                    this.root.getAccount(account.prefix),
                ];
            })) };
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
        utils_1.debug("reading key from file", this.keyFilePath);
        return getKeyFromFile(this.keyFilePath);
    }
    // Hook that child classes can override to add functionality before `connect` call
    async beforeConnect() { }
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
        utils_1.debug("About to runtime.run with config", this.config);
        try {
            this.keyStore = await this.getKeyStore();
            utils_1.debug("About to call beforeConnect");
            await this.beforeConnect();
            utils_1.debug("About to call connect");
            await this.connect();
            utils_1.debug("About to call afterConnect");
            await this.afterConnect();
            if (args)
                utils_1.debug(`Passing ${Object.getOwnPropertyNames(args)}`);
            await fn(this.accounts, this);
        }
        catch (e) {
            utils_1.debug(e.stack);
            throw e; //TODO Figure out better error handling
        }
        finally {
            // Do any needed teardown
            await this.afterRun();
        }
    }
    async createRun(fn) {
        utils_1.debug("About to runtime.createRun with config", this.config);
        try {
            this.keyStore = await this.getKeyStore();
            utils_1.debug("About to call beforeConnect");
            await this.beforeConnect();
            utils_1.debug("About to call connect");
            await this.connect();
            utils_1.debug("About to call afterConnect");
            await this.afterConnect();
            const accounts = await fn({ runtime: this, root: this.getRoot() });
            this.createdAccounts = { ...this.createdAccounts, ...accounts };
            return accounts;
        }
        catch (e) {
            utils_1.debug(e);
            throw e; //TODO Figure out better error handling
        }
        finally {
            // Do any needed teardown
            await this.afterRun();
        }
    }
    async addMasterAccountKey() {
        const masterKey = await this.getMasterKey();
        await this.keyStore.setKey(this.config.network, this.masterAccount, masterKey);
    }
    getRoot() {
        return this.root;
    }
    isSandbox() {
        return this.config.network == "sandbox";
    }
    isTestnet() {
        return this.config.network == "testnet";
    }
    async executeTransaction(fn) {
        const res = await fn();
        return res;
    }
    addAccountCreated(accountId, sender) {
        const short = accountId.replace(`.${sender.accountId}`, "");
        this.accountsCreated.set(accountId, short);
    }
}
exports.Runtime = Runtime;
class TestnetRuntime extends Runtime {
    static async create(config, fn) {
        utils_1.debug('Skipping initialization function for testnet; will run before each `runner.run`');
        return new TestnetRuntime({ ...this.defaultConfig, ...{ initFn: fn }, ...config });
    }
    async createFrom() {
        return new TestnetRuntime({ ...this.config, ...{ init: false, initFn: this.config.initFn } }, this.createdAccounts);
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
            walletUrl: "https://wallet.testnet.near.org",
            helperUrl: "https://helper.testnet.near.org",
            explorerUrl: "https://explorer.testnet.near.org",
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
        const res = await this.provider.query({
            request_type: 'view_code',
            finality: 'final',
            account_id
        });
        return Buffer.from(res.code_base64, 'base64');
    }
    get baseAccountId() {
        return "testnet";
    }
    get keyFilePath() {
        return path_1.join(os.homedir(), `.near-credentials`, `${this.network}`, `${this.masterAccount}.json`);
    }
    async getKeyStore() {
        const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(path_1.join(os.homedir(), `.near-credentials`));
        return keyStore;
    }
    async beforeConnect() {
        await this.ensureKeyFileFolder();
        const accountCreator = new nearAPI.accountCreator.UrlAccountCreator({}, // ignored
        this.config.helperUrl);
        if (!this.config.masterAccount) {
            // create new `dev-deploy`-style account (or reuse existing)
            this.config.masterAccount = randomAccountId();
        }
        await this.addMasterAccountKey();
        await accountCreator.createAccount(this.masterAccount, (await this.getMasterKey()).getPublicKey());
        utils_1.debug(`Added masterAccount ${this.config.masterAccount} with keyStore ${this.keyStore} and publicKey ${await this.keyStore.getKey(this.config.network, this.masterAccount)}
      https://explorer.testnet.near.org/accounts/${this.masterAccount}`);
    }
    async afterConnect() {
        if (this.config.initFn) {
            utils_1.debug('About to run initFn');
            this.createdAccounts = await this.config.initFn({ runtime: this, root: this.getRoot() });
        }
    }
    // TODO: Delete any accounts created
    async afterRun() { }
    async ensureKeyFileFolder() {
        const keyFolder = path_1.dirname(this.keyFilePath);
        try {
            await fs_1.promises.mkdir(keyFolder, { recursive: true });
        }
        catch (e) {
            // TODO: check error
        }
    }
}
exports.TestnetRuntime = TestnetRuntime;
class SandboxRuntime extends Runtime {
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
            initialBalance: utils_2.toYocto("100"),
        };
    }
    static async create(config, fn) {
        const defaultConfig = await this.defaultConfig();
        const sandbox = new SandboxRuntime({ ...defaultConfig, ...config });
        if (fn) {
            utils_1.debug('Running initialization function to set up sandbox for all future calls to `runner.run`');
            await sandbox.createRun(fn);
        }
        return sandbox;
    }
    async createFrom() {
        const config = await SandboxRuntime.defaultConfig();
        return new SandboxRuntime({ ...config, ...{ init: false, refDir: this.homeDir } }, this.createdAccounts);
    }
    get baseAccountId() {
        return SandboxRuntime.BASE_ACCOUNT_ID;
    }
    get keyFilePath() {
        return path_1.join(this.homeDir, "validator_key.json");
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
            await this.root.createAndDeploy("sandbox", SandboxRuntime.LINKDROP_PATH);
            utils_1.debug("Deployed 'sandbox' linkdrop contract");
        }
    }
    async beforeConnect() {
        if (!(await utils_1.exists(SandboxRuntime.LINKDROP_PATH))) {
            utils_1.debug(`Downloading testnet's linkdrop to ${SandboxRuntime.LINKDROP_PATH}`);
            await fs_1.promises.writeFile(SandboxRuntime.LINKDROP_PATH, await TestnetRuntime.viewCode("testnet"));
        }
        this.server = await server_1.SandboxServer.init(this.config);
        if (this.init)
            await this.addMasterAccountKey();
        await this.server.start();
    }
    async afterRun() {
        utils_1.debug("Closing server with port " + this.config.port);
        this.server.close();
    }
}
exports.SandboxRuntime = SandboxRuntime;
SandboxRuntime.LINKDROP_PATH = path_1.join(__dirname, '..', '..', 'core_contracts', "testnet-linkdrop.wasm");
// TODO: edit genesis.json to add sandbox as an account
SandboxRuntime.BASE_ACCOUNT_ID = "test.near";
//# sourceMappingURL=runtime.js.map