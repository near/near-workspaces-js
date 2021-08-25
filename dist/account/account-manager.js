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
exports.ManagedTransaction = exports.SandboxManager = exports.TestnetManager = exports.AccountManager = void 0;
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const nearAPI = __importStar(require("near-api-js"));
const helper_funcs_1 = require("../helper-funcs");
const types_1 = require("../types");
const utils_1 = require("../utils");
const transaction_1 = require("../transaction");
const jsonrpc_1 = require("../jsonrpc");
const account_1 = require("./account");
const utils_2 = require("./utils");
function timeSuffix(prefix, length = 99999) {
    return `${prefix}${Date.now() % length}`;
}
async function findAccountsWithPrefix(prefix, keyStore, network) {
    const accounts = await keyStore.getAccounts(network);
    utils_1.debug(`Looking ${prefix} in ${accounts.join('\n')}`);
    const paths = accounts.filter(f => f.startsWith(prefix));
    utils_1.debug(`found [${paths.join(', ')}]`);
    if (paths.length > 0) {
        return paths;
    }
    return [timeSuffix(prefix, 9999999)];
}
class AccountManager {
    constructor(config) {
        this.config = config;
        this.accountsCreated = new Set();
    }
    static create(config) {
        const { network } = config;
        switch (network) {
            case 'sandbox':
                return new SandboxManager(config);
            case 'testnet':
                return new TestnetManager(config);
            default: throw new Error(`Bad network id: ${network} expected "testnet" or "sandbox"`);
        }
    }
    getAccount(accountId) {
        return new account_1.Account(accountId, this);
    }
    async deleteKey(account_id) {
        utils_1.debug(`About to delete key for ${account_id}`);
        await this.keyStore.removeKey(this.networkId, account_id);
        utils_1.debug('deleted Key');
    }
    async init() {
        return this;
    }
    get root() {
        return new account_1.Account(this.rootAccountId, this);
    }
    get initialBalance() {
        var _a;
        return (_a = this.config.initialBalance) !== null && _a !== void 0 ? _a : this.DEFAULT_INITIAL_BALANCE;
    }
    get provider() {
        return jsonrpc_1.JSONRpc.from(this.config);
    }
    createTransaction(sender, receiver) {
        return new ManagedTransaction(this, sender, receiver);
    }
    async getKey(accountId) {
        return this.keyStore.getKey(this.networkId, accountId);
    }
    /** Sets the provider key to store, otherwise creates a new one */
    async setKey(accountId, keyPair) {
        const key = keyPair !== null && keyPair !== void 0 ? keyPair : types_1.KeyPairEd25519.fromRandom();
        await this.keyStore.setKey(this.networkId, accountId, key);
        utils_1.debug(`setting keys for ${accountId}`);
        return (await this.getKey(accountId));
    }
    async removeKey(accountId) {
        await this.keyStore.removeKey(this.networkId, accountId);
    }
    async deleteAccount(accountId, beneficiaryId) {
        await this.getAccount(accountId).delete(beneficiaryId);
    }
    async getRootKey() {
        const keyPair = await this.getKey(this.rootAccountId);
        if (!keyPair) {
            return this.setKey(this.rootAccountId);
        }
        return keyPair;
    }
    async balance(account) {
        return this.provider.account_balance(helper_funcs_1.asId(account));
    }
    async exists(accountId) {
        return this.provider.accountExists(helper_funcs_1.asId(accountId));
    }
    async executeTransaction(tx, keyPair) {
        const account = new nearAPI.Account(this.connection, tx.senderId);
        let oldKey = null;
        if (keyPair) {
            oldKey = await this.getKey(account.accountId);
            await this.setKey(account.accountId, keyPair);
        }
        // @ts-expect-error access shouldn't be protected
        const outcome = await account.signAndSendTransaction({ receiverId: tx.receiverId, actions: tx.actions });
        if (oldKey) {
            await this.setKey(account.accountId, oldKey);
        }
        return outcome;
    }
    addAccountCreated(account, _sender) {
        this.accountsCreated.add(account);
    }
    async cleanup() { } // eslint-disable-line @typescript-eslint/no-empty-function
    get rootAccountId() {
        return this.config.rootAccount;
    }
    get keyStore() {
        var _a;
        return (_a = this.config.keyStore) !== null && _a !== void 0 ? _a : this.defaultKeyStore;
    }
    get signer() {
        return new nearAPI.InMemorySigner(this.keyStore);
    }
    get networkId() {
        return this.config.network;
    }
    get connection() {
        return new nearAPI.Connection(this.networkId, this.provider, this.signer);
    }
}
exports.AccountManager = AccountManager;
class TestnetManager extends AccountManager {
    static get defaultKeyStore() {
        const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(this.KEYSTORE_PATH);
        return keyStore;
    }
    get DEFAULT_INITIAL_BALANCE() {
        return helper_funcs_1.toYocto('10');
    }
    get defaultKeyStore() {
        return TestnetManager.defaultKeyStore;
    }
    async init() {
        await this.createAndFundAccount();
        return this;
    }
    async createAccount(accountId, pubKey) {
        const accountCreator = new nearAPI.accountCreator.UrlAccountCreator({}, // ignored
        this.config.helperUrl);
        await accountCreator.createAccount(accountId, pubKey);
        return this.getAccount(accountId);
    }
    async addFunds() {
        const temporaryId = helper_funcs_1.randomAccountId();
        utils_1.debug(`adding funds to ${this.rootAccountId} using ${temporaryId}`);
        const keyPair = await this.getRootKey();
        const { keyStore } = this;
        await keyStore.setKey(this.networkId, temporaryId, keyPair);
        const account = await this.createAccount(temporaryId, keyPair.getPublicKey());
        await account.delete(this.rootAccountId);
    }
    async createAndFundAccount() {
        await this.initRootAccount();
        const accountId = this.rootAccountId;
        if (!(await this.provider.accountExists(accountId))) {
            const keyPair = await this.getRootKey();
            const { keyStore } = this;
            await keyStore.setKey(this.networkId, accountId, keyPair);
            await this.createAccount(accountId, keyPair.getPublicKey());
            utils_1.debug(`Added masterAccount ${accountId}
          https://explorer.testnet.near.org/accounts/${this.rootAccountId}`);
        }
        if (new types_1.BN((await this.root.balance()).available).lt(new types_1.BN(helper_funcs_1.toYocto('1000')))) {
            await this.addFunds();
        }
    }
    async initRootAccount() {
        if (this.config.rootAccount !== undefined) {
            return;
        }
        const [fileName, lineNumber] = utils_2.findCallerFile();
        const p = path.parse(fileName);
        if (['.ts', '.js'].includes(p.ext)) {
            const hash = utils_2.hashPathBase64(fileName);
            const name = `l${lineNumber}${hash.slice(0, 6)}`;
            const accounts = await findAccountsWithPrefix(name, this.keyStore, this.networkId);
            const accountId = accounts.shift();
            await Promise.all(accounts.map(async (acc) => {
                await this.deleteAccount(acc, accountId);
            }));
            this.config.rootAccount = accountId;
            return;
        }
        throw new Error(`Bad filename/account name passed: ${fileName}`);
    }
    async createFrom(config) {
        return (new TestnetManager({ ...config, ...this.config, rootAccount: undefined })).init();
    }
    async cleanup() {
        await Promise.all([...this.accountsCreated.values()]
            .map(async (id) => this.getAccount(id).delete(this.rootAccountId)));
    }
}
exports.TestnetManager = TestnetManager;
TestnetManager.KEYSTORE_PATH = path.join(os.homedir(), '.near-credentials', 'near-runner');
TestnetManager.KEY_DIR_PATH = path.join(TestnetManager.KEYSTORE_PATH, 'testnet');
class SandboxManager extends AccountManager {
    async init() {
        if (!await this.getKey(this.rootAccountId)) {
            await this.setKey(this.rootAccountId, await utils_2.getKeyFromFile(this.keyFilePath));
        }
        return this;
    }
    async createFrom(config) {
        return new SandboxManager(config);
    }
    get DEFAULT_INITIAL_BALANCE() {
        return helper_funcs_1.toYocto('200');
    }
    get defaultKeyStore() {
        const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(this.config.homeDir);
        return keyStore;
    }
    get keyFilePath() {
        return path.join(this.config.homeDir, 'validator_key.json');
    }
}
exports.SandboxManager = SandboxManager;
class ManagedTransaction extends transaction_1.Transaction {
    constructor(manager, sender, receiver) {
        super(sender, receiver);
        this.manager = manager;
        this.delete = false;
    }
    createAccount() {
        this.manager.addAccountCreated(this.receiverId, this.senderId);
        return super.createAccount();
    }
    deleteAccount(beneficiaryId) {
        this.delete = true;
        return super.deleteAccount(beneficiaryId);
    }
    /**
     *
     * @param keyPair Temporary key to sign transaction
     * @returns
     */
    async signAndSend(keyPair) {
        const executionResult = await this.manager.executeTransaction(this, keyPair);
        // @ts-expect-error status could not have SuccessValue and this would catch that
        if (executionResult.status.SuccessValue !== undefined && this.delete) {
            await this.manager.deleteKey(this.receiverId);
        }
        return executionResult;
    }
}
exports.ManagedTransaction = ManagedTransaction;
//# sourceMappingURL=account-manager.js.map