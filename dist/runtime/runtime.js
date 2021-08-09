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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestnetRuntime = exports.Runtime = void 0;
const fs_1 = require("fs");
const bn_js_1 = __importDefault(require("bn.js"));
const nearAPI = __importStar(require("near-api-js"));
const path_1 = require("path");
const account_1 = require("./account");
const server_1 = require("./server");
const utils_1 = require("../utils");
const DEFAULT_INITIAL_DEPOSIT = "1" + "0".repeat(25);
class Runtime {
    constructor(config) {
        this.config = this.getConfig(config);
    }
    static async create(config) {
        if (config.network === 'testnet') {
            return new TestnetRuntime(config);
        }
        return new SandboxRuntime(config);
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
        return this.config.rootAccountName;
    }
    getConfig(config) {
        const defaultConfig = this.defaultConfig;
        defaultConfig.rootAccountName = config.rootAccountName || this.randomAccountId();
        return {
            ...this.defaultConfig,
            ...config
        };
    }
    async getKeyFromFile() {
        const filePath = path_1.join(this.homeDir, "validator_key.json");
        try {
            const keyFile = require(filePath);
            return nearAPI.utils.KeyPair.fromString(keyFile.secret_key || keyFile.private_key);
        }
        catch (e) {
        }
        const file = await fs_1.promises.open(filePath, "w");
        const keyPair = nearAPI.utils.KeyPairEd25519.fromRandom();
        await file.writeFile(JSON.stringify({
            secret_key: keyPair.toString()
        }));
        file.close();
        return keyPair;
    }
    async getKeyStore() {
        this.masterKey = await this.getKeyFromFile();
        const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(this.homeDir);
        if (this.init) {
            await keyStore.setKey(this.config.network, this.masterAccount, this.masterKey);
        }
        return keyStore;
    }
    async connect() {
        const keyStore = await this.getKeyStore();
        this.near = await nearAPI.connect({
            keyStore,
            networkId: this.config.network,
            nodeUrl: this.rpcAddr,
            masterAccount: this.masterAccount,
        });
        this.root = new account_1.Account(new nearAPI.Account(this.near.connection, this.masterAccount));
    }
    async run(fn) {
        try {
            // Run any setup before trying to connect to a server
            utils_1.debug("About to call setup");
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
    get pubKey() {
        return this.masterKey.getPublicKey();
    }
    async createAccount(name, keyPair) {
        const pubKey = await this.addKey(name, keyPair);
        await this.near.accountCreator.createAccount(name, pubKey);
        return this.getAccount(name);
    }
    async createAndDeploy(name, wasm, initialDeposit = new bn_js_1.default(10).pow(new bn_js_1.default(25))) {
        const pubKey = await this.addKey(name);
        const najContractAccount = await this.root.najAccount.createAndDeployContract(name, pubKey, await fs_1.promises.readFile(wasm), initialDeposit);
        return new account_1.ContractAccount(najContractAccount);
    }
    getRoot() {
        return this.root;
    }
    getAccount(name) {
        return new account_1.Account(new nearAPI.Account(this.near.connection, name));
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
    randomAccountId(keyPair) {
        let accountId;
        // create random number with at least 7 digits
        const randomNumber = Math.floor(Math.random() * (9999999 - 1000000) + 1000000);
        accountId = `dev-${Date.now()}-${randomNumber}`;
        return accountId;
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
    // Run inital function so that function starts at initial state
    async setup() {
    }
    // Delete any accounts created
    async tearDown() {
    }
    // TODO: create temp account and track to be deleted
    createAccount(name, keyPair) {
        return super.createAccount(name, keyPair);
    }
    async createAndDeploy(name, wasm, initialDeposit = new bn_js_1.default(10).pow(new bn_js_1.default(25))) {
        // TODO: dev deploy!!
        return super.createAndDeploy(name, wasm, initialDeposit);
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
            rootAccountName: 'test.near',
            rpcAddr: `http://localhost:${port}`,
            initialBalance: DEFAULT_INITIAL_DEPOSIT,
        };
    }
    get rpcAddr() {
        return `http://localhost:${this.config.port}`;
    }
    async setup() {
        this.server = await server_1.SandboxServer.init(this.config);
        await this.server.start();
    }
    async tearDown() {
        utils_1.debug("Closing server with port " + this.server.port);
        this.server.close();
    }
}
//# sourceMappingURL=runtime.js.map