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
exports.TestnetRuntime = exports.Runtime = void 0;
const fs_1 = require("fs");
const nearAPI = __importStar(require("near-api-js"));
const path_1 = require("path");
const os = __importStar(require("os"));
const account_1 = require("./account");
const server_1 = require("./server");
const utils_1 = require("../utils");
const DEFAULT_INITIAL_DEPOSIT = utils_1.toYocto("10");
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
        const keyFile = await fs_1.promises.open(filePath, "w");
        const keyPair = nearAPI.utils.KeyPairEd25519.fromRandom();
        await keyFile.writeFile(JSON.stringify({
            secret_key: keyPair.toString()
        }));
        await keyFile.close();
        return keyPair;
    }
}
class Runtime {
    constructor(config) {
        this.config = this.getConfig(config);
    }
    static async create(config, f) {
        let runtime;
        switch (config.network) {
            case 'testnet': {
                if (f) {
                    utils_1.debug('Skipping initialization function for testnet; will run before each `runner.run`');
                }
                return new TestnetRuntime(config);
            }
            case 'sandbox': {
                const runtime = new SandboxRuntime(config);
                if (f) {
                    utils_1.debug('Running initialization function to set up sandbox for all future calls to `runner.run`');
                    await runtime.run(f);
                }
                return runtime;
            }
            default:
                throw new Error(`config.network = '${config.network}' invalid; ` +
                    "must be 'testnet' or 'sandbox' (the default)");
        }
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
        return getKeyFromFile(this.keyFilePath);
    }
    getConfig(config) {
        return {
            ...this.defaultConfig,
            ...config
        };
    }
    // Hook that child classes can override to add functionality before `connect` call
    async beforeConnect() { }
    // Hook that child classes can override to add functionality after `connect` call
    async afterConnect() { }
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
        this.root = new account_1.Account(new nearAPI.Account(this.near.connection, this.masterAccount));
    }
    async run(fn) {
        utils_1.debug('About to runtime.run with config', this.config);
        try {
            this.keyStore = await this.getKeyStore();
            utils_1.debug("About to call beforeConnect");
            await this.beforeConnect();
            utils_1.debug("About to call connect");
            await this.connect();
            utils_1.debug("About to call afterConnect");
            await this.afterConnect();
            utils_1.debug("About to call run");
            await fn(this);
        }
        catch (e) {
            console.error(e);
            throw e; //TODO Figure out better error handling
        }
        finally {
            // Do any needed teardown
            await this.afterRun();
        }
    }
    async addMasterAccountKey() {
        await this.keyStore.setKey(this.config.network, this.masterAccount, await this.getMasterKey());
    }
    async createAccount(name, keyPair) {
        const pubKey = await this.addKey(name, keyPair);
        await this.near.accountCreator.createAccount(name, pubKey);
        return this.getAccount(name);
    }
    async createAndDeploy(name, wasm) {
        const pubKey = await this.addKey(name);
        await this.near.accountCreator.createAccount(name, pubKey);
        const najAccount = this.near.account(name);
        const contractData = await fs_1.promises.readFile(wasm);
        const result = await najAccount.deployContract(contractData);
        utils_1.debug(`deployed contract ${wasm} to account ${name} with result ${JSON.stringify(result)}`);
        return new account_1.ContractAccount(najAccount);
    }
    getRoot() {
        return this.root;
    }
    getAccount(name) {
        return new account_1.Account(this.near.account(name));
    }
    getContractAccount(name) {
        return new account_1.ContractAccount(new nearAPI.Account(this.near.connection, name));
    }
    isSandbox() {
        return this.config.network == "sandbox";
    }
    isTestnet() {
        return this.config.network == "testnet";
    }
    async addKey(name, keyPair) {
        let pubKey;
        if (keyPair) {
            const key = await nearAPI.InMemorySigner.fromKeyPair(this.network, name, keyPair);
            pubKey = await key.getPublicKey();
        }
        else {
            pubKey = await this.near.connection.signer.createKey(name, this.config.network);
        }
        return pubKey;
    }
}
exports.Runtime = Runtime;
class TestnetRuntime extends Runtime {
    get defaultConfig() {
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
    get keyFilePath() {
        return path_1.join(`${os.homedir()}/.near-credentials/testnet`, `${this.masterAccount}.json`);
    }
    async getKeyStore() {
        const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(`${os.homedir()}/.near-credentials`);
        return keyStore;
    }
    async beforeConnect() {
        await this.ensureKeyFileFolder();
        const accountCreator = new nearAPI.accountCreator.UrlAccountCreator({}, // ignored
        this.config.helperUrl);
        if (this.config.masterAccount) {
            throw new Error('custom masterAccount not yet supported on testnet');
            // create sub-accounts of it with random IDs
            this.config.masterAccount = `${randomAccountId()}.something`;
        }
        else {
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
            await this.config.initFn(this);
        }
    }
    // Delete any accounts created
    async afterRun() {
    }
    // TODO: create temp account and track to be deleted
    async createAccount(name, keyPair) {
        // TODO: subaccount done twice
        const account = await super.createAccount(this.makeSubAccount(name), keyPair);
        utils_1.debug(`New Account: https://explorer.testnet.near.org/accounts/${account.accountId}`);
        return account;
    }
    async createAndDeploy(name, wasm) {
        // TODO: dev deploy!!
        const account = await super.createAndDeploy(this.makeSubAccount(name), wasm);
        utils_1.debug(`Deployed new account: https://explorer.testnet.near.org/accounts/${account.accountId}`);
        return account;
    }
    getAccount(name) {
        return super.getAccount(this.makeSubAccount(name));
    }
    getContractAccount(name) {
        return super.getContractAccount(this.makeSubAccount(name));
    }
    makeSubAccount(name) {
        return `${name}.${this.masterAccount}`;
    }
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
    get defaultConfig() {
        const port = server_1.SandboxServer.nextPort();
        return {
            homeDir: server_1.getHomeDir(port),
            port,
            init: true,
            rm: false,
            refDir: null,
            network: 'sandbox',
            masterAccount: 'test.near',
            rpcAddr: `http://localhost:${port}`,
            initialBalance: DEFAULT_INITIAL_DEPOSIT,
        };
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
    async beforeConnect() {
        this.server = await server_1.SandboxServer.init(this.config);
        if (this.init)
            await this.addMasterAccountKey();
        await this.server.start();
    }
    async afterRun() {
        utils_1.debug("Closing server with port " + this.server.port);
        this.server.close();
    }
}
//# sourceMappingURL=runtime.js.map