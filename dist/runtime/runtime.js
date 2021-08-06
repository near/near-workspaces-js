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
    getConfig(config) {
        return {
            ...this.defaultConfig,
            ...config
        };
    }
    async connect(rpcAddr, homeDir, init) {
        const keyFile = require(path_1.join(homeDir, "validator_key.json"));
        this.masterKey = nearAPI.utils.KeyPair.fromString(keyFile.secret_key || keyFile.private_key);
        const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(homeDir);
        if (init) {
            await keyStore.setKey(this.config.network, this.config.rootAccountName, this.masterKey);
        }
        this.near = await nearAPI.connect({
            keyStore,
            networkId: this.config.network,
            nodeUrl: rpcAddr,
        });
        this.root = new account_1.Account(new nearAPI.Account(this.near.connection, this.config.rootAccountName));
    }
    checkConnected() {
        if (!this.root || !this.near || !this.masterKey) {
            throw new Error('need to call `connect`');
        }
    }
    get pubKey() {
        this.checkConnected();
        return this.masterKey.getPublicKey();
    }
    async createAccount(name) {
        this.checkConnected();
        const pubKey = await this.near.connection.signer.createKey(name, this.config.network);
        await this.root.najAccount.createAccount(name, pubKey, new bn_js_1.default(10).pow(new bn_js_1.default(25)));
        return this.getAccount(name);
    }
    async createAndDeploy(name, wasm, initialDeposit = new bn_js_1.default(10).pow(new bn_js_1.default(25))) {
        this.checkConnected();
        const pubKey = await this.near.connection.signer.createKey(name, this.config.network);
        const najContractAccount = await this.root.najAccount.createAndDeployContract(name, pubKey, await fs_1.promises.readFile(wasm), initialDeposit);
        return new account_1.ContractAccount(najContractAccount);
    }
    getRoot() {
        this.checkConnected();
        return this.root;
    }
    getAccount(name) {
        this.checkConnected();
        return new account_1.Account(new nearAPI.Account(this.near.connection, name));
    }
    getContractAccount(name) {
        this.checkConnected();
        return new account_1.ContractAccount(new nearAPI.Account(this.near.connection, name));
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
            rootAccountName: 'oh-no',
        };
    }
    async run(_fn) {
        throw new Error("TestnetRuntime coming soon!");
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
        };
    }
    async run(f) {
        const server = await server_1.SandboxServer.init(this.config);
        try {
            await server.start(); // Wait until server is ready
            await this.connect(server.rpcAddr, server.homeDir, this.config.init);
            await f(this);
            return this;
        }
        catch (e) {
            console.error(e);
            throw e;
        }
        finally {
            utils_1.debug("Closing server with port " + server.port);
            server.close();
        }
    }
}
//# sourceMappingURL=runtime.js.map