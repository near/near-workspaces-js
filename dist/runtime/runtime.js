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
const DEFAULT_INITIAL_DEPOSIT = "1" + "0".repeat(25);
function randomAccountId() {
    let accountId;
    // create random number with at least 7 digits
    const randomNumber = Math.floor(Math.random() * (9999999 - 1000000) + 1000000);
    accountId = `dev-${Date.now()}-${randomNumber}`;
    return accountId;
}
async function getKeyFromFile(filePath) {
    try {
        const keyFile = require(filePath);
        return nearAPI.utils.KeyPair.fromString(keyFile.secret_key || keyFile.private_key);
    }
    catch (e) {
        const keyFile = await fs_1.promises.open(filePath, "w");
        const keyPair = nearAPI.utils.KeyPairEd25519.fromRandom();
        await keyFile.writeFile(JSON.stringify({
            secret_key: keyPair.toString()
        }));
        keyFile.close();
        return keyPair;
    }
}
class Runtime {
    constructor(config) {
        this.config = this.getConfig(config);
    }
    static async create(config, f) {
        if (config.network === 'testnet') {
            const runtime = new TestnetRuntime(config);
            if (f) {
                utils_1.debug('Skipping initialization function for testnet; will run before each `runner.run`');
            }
            return runtime;
        }
        else {
            const runtime = new SandboxRuntime(config);
            if (f) {
                utils_1.debug('Running initialization function to set up sandbox for all future calls to `runner.run`');
                await runtime.run(f);
            }
            return runtime;
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
    getConfig(config) {
        return {
            ...this.defaultConfig,
            ...config
        };
    }
    async connect() {
        this.near = await nearAPI.connect({
            keyStore: this.keyStore,
            networkId: this.config.network,
            nodeUrl: this.rpcAddr,
            masterAccount: this.masterAccount,
            helperUrl: this.config.helperUrl,
            walletUrl: this.config.walletUrl,
            initialBalance: this.config.initialBalance,
        });
        this.root = new account_1.Account(new nearAPI.Account(this.near.connection, this.masterAccount));
    }
    async run(fn) {
        try {
            // Run any setup before trying to connect to a server
            utils_1.debug("About to call setup");
            this.keyStore = await this.getKeyStore();
            await this.setup();
            // Set up connection to node
            utils_1.debug("About to connect");
            await this.connect();
            // Run function
            await fn(this);
        }
        catch (e) {
            console.error(e);
            throw e; //TODO Figure out better error handling
        }
        finally {
            // Do any needed teardown
            await this.tearDown();
        }
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
            homeDir: '',
            port: 3030,
            init: true,
            rm: false,
            refDir: null,
            network: 'testnet',
            rpcAddr: 'https://rpc.testnet.near.org',
            walletUrl: "https://wallet.testnet.near.org",
            helperUrl: "https://helper.testnet.near.org"
        };
    }
    get keyFilePath() {
        return path_1.join(`${os.homedir()}/.near-credentials/testnet`, `${this.masterAccount}.json`);
    }
    async getKeyStore() {
        const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(this.homeDir);
        return keyStore;
    }
    // Run inital function so that function starts at initial state
    async setup() {
        if (this.config.masterAccount) {
            throw new Error('custom masterAccount not yet supported on testnet');
            // create sub-accounts of it with random IDs
            this.config.masterAccount = `${randomAccountId()}.something`;
        }
        else {
            // create new `dev-deploy`-style account (or reuse existing)
            this.config.masterAccount = randomAccountId();
        }
        if (this.config.initFn) {
            await this.run(this.config.initFn);
        }
    }
    // Delete any accounts created
    async tearDown() {
    }
    // TODO: create temp account and track to be deleted
    createAccount(name, keyPair) {
        return super.createAccount(name, keyPair);
    }
    async createAndDeploy(name, wasm) {
        // TODO: dev deploy!!
        return super.createAndDeploy(name, wasm);
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
    async setup() {
        this.server = await server_1.SandboxServer.init(this.config);
        if (this.init) {
            const masterKey = await getKeyFromFile(this.keyFilePath);
            await this.keyStore.setKey(this.config.network, this.masterAccount, masterKey);
        }
        await this.server.start();
    }
    async tearDown() {
        utils_1.debug("Closing server with port " + this.server.port);
        this.server.close();
    }
}
//# sourceMappingURL=runtime.js.map