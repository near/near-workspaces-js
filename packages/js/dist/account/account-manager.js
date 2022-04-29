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
const process = __importStar(require("process"));
const nearAPI = __importStar(require("near-api-js"));
const near_units_1 = require("near-units");
const utils_1 = require("../utils");
const types_1 = require("../types");
const internal_utils_1 = require("../internal-utils");
const transaction_1 = require("../transaction");
const jsonrpc_1 = require("../jsonrpc");
const transaction_result_1 = require("../transaction-result");
const account_1 = require("./account");
const utils_2 = require("./utils");
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
            default: throw new Error(`Bad network id: "${network}"; expected "testnet" or "sandbox"`);
        }
    }
    async accountView(accountId) {
        return this.provider.viewAccount(accountId);
    }
    getAccount(accountId) {
        return new account_1.Account(accountId, this);
    }
    getParentAccount(accountId) {
        const split = accountId.split('.');
        if (split.length === 1) {
            return this.getAccount(accountId);
        }
        return this.getAccount(split.slice(1).join('.'));
    }
    async deleteKey(accountId) {
        try {
            await this.keyStore.removeKey(this.networkId, accountId);
            (0, internal_utils_1.debug)(`deleted Key for ${accountId}`);
        }
        catch {
            (0, internal_utils_1.debug)(`Failed to delete key for ${accountId}`);
        }
    }
    async init() {
        return this;
    }
    get root() {
        if (!this._root) {
            this._root = new account_1.Account(this.rootAccountId, this);
        }
        return this._root;
    }
    get initialBalance() {
        var _a;
        return (_a = this.config.initialBalance) !== null && _a !== void 0 ? _a : this.DEFAULT_INITIAL_BALANCE;
    }
    get doubleInitialBalance() {
        return new types_1.BN(this.initialBalance).mul(new types_1.BN('2'));
    }
    get provider() {
        return jsonrpc_1.JsonRpcProvider.from(this.config);
    }
    batch(sender, receiver) {
        return new ManagedTransaction(this, sender, receiver);
    }
    async getKey(accountId) {
        return this.keyStore.getKey(this.networkId, accountId);
    }
    async getPublicKey(accountId) {
        var _a, _b;
        return (_b = (_a = (await this.getKey(accountId))) === null || _a === void 0 ? void 0 : _a.getPublicKey()) !== null && _b !== void 0 ? _b : null;
    }
    /** Sets the provided key to store, otherwise creates a new one */
    async setKey(accountId, keyPair) {
        const key = keyPair !== null && keyPair !== void 0 ? keyPair : types_1.KeyPairEd25519.fromRandom();
        await this.keyStore.setKey(this.networkId, accountId, key);
        (0, internal_utils_1.debug)(`Setting keys for ${accountId}`);
        return (await this.getKey(accountId));
    }
    async removeKey(accountId) {
        await this.keyStore.removeKey(this.networkId, accountId);
    }
    async deleteAccount(accountId, beneficiaryId, keyPair) {
        try {
            return await this.getAccount(accountId).delete(beneficiaryId, keyPair);
        }
        catch (error) {
            if (keyPair) {
                (0, internal_utils_1.debug)(`Failed to delete ${accountId} with different keyPair`);
                return this.deleteAccount(accountId, beneficiaryId);
            }
            throw error;
        }
    }
    async getRootKey() {
        const keyPair = await this.getKey(this.rootAccountId);
        if (!keyPair) {
            return this.setKey(this.rootAccountId);
        }
        return keyPair;
    }
    async balance(account) {
        return this.provider.accountBalance((0, utils_1.asId)(account));
    }
    async availableBalance(account) {
        return (await this.balance(account)).available;
    }
    async exists(accountId) {
        return this.provider.accountExists((0, utils_1.asId)(accountId));
    }
    async canCoverBalance(account, amount) {
        return amount.lt(await this.availableBalance(account));
    }
    async executeTransaction(tx, keyPair) {
        var _a;
        const account = new nearAPI.Account(this.connection, tx.senderId);
        let oldKey = null;
        if (keyPair) {
            oldKey = await this.getKey(account.accountId);
            await this.setKey(account.accountId, keyPair);
        }
        try {
            const start = Date.now();
            // @ts-expect-error access shouldn't be protected
            const outcome = await account.signAndSendTransaction({ receiverId: tx.receiverId, actions: tx.actions, returnError: true });
            const end = Date.now();
            if (oldKey) {
                await this.setKey(account.accountId, oldKey);
            }
            else if (keyPair) {
                // Sender account should only have account while execution transaction
                await this.deleteKey(tx.senderId);
            }
            const result = new transaction_result_1.TransactionResult(outcome, start, end, this.config);
            (0, internal_utils_1.txDebug)(result.summary());
            return result;
        }
        catch (error) {
            // Add back oldKey if temporary one was used
            if (oldKey) {
                await this.setKey(account.accountId, oldKey);
            }
            if (error instanceof Error) {
                const key = await this.getPublicKey(tx.receiverId);
                (0, internal_utils_1.debug)(`TX FAILED: receiver ${tx.receiverId} with key ${(_a = key === null || key === void 0 ? void 0 : key.toString()) !== null && _a !== void 0 ? _a : 'MISSING'} ${JSON.stringify(tx.actions).slice(0, 1000)}`);
                (0, internal_utils_1.debug)(error);
            }
            throw error;
        }
    }
    addAccountCreated(account, _sender) {
        this.accountsCreated.add(account);
    }
    async cleanup() { } // eslint-disable-line @typescript-eslint/no-empty-function
    get rootAccountId() {
        return this.config.rootAccountId;
    }
    set rootAccountId(value) {
        this.config.rootAccountId = value;
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
    get masterAccountId() {
        var _a;
        const passedAccountId = (_a = this.config.testnetMasterAccountId) !== null && _a !== void 0 ? _a : process.env.TESTNET_MASTER_ACCOUNT_ID;
        if (!passedAccountId) {
            throw new Error('Master account is not provided. You can set it in config while calling Worker.init(config); or with TESTNET_MASTER_ACCOUNT_ID env variable');
        }
        return passedAccountId;
    }
    get fullRootAccountId() {
        return this.rootAccountId + '.' + this.masterAccountId;
    }
    get root() {
        if (!this._testnetRoot) {
            this._testnetRoot = new account_1.Account(this.fullRootAccountId, this);
        }
        return this._testnetRoot;
    }
    get DEFAULT_INITIAL_BALANCE() {
        return near_units_1.NEAR.parse('10 N').toJSON();
    }
    get defaultKeyStore() {
        return TestnetManager.defaultKeyStore;
    }
    get urlAccountCreator() {
        return new nearAPI.accountCreator.UrlAccountCreator({}, // ignored
        this.config.helperUrl);
    }
    async init() {
        if (!this.rootAccountId) {
            this.rootAccountId = (0, utils_1.randomAccountId)('r-', 5, 5);
        }
        if (!(await this.exists(this.fullRootAccountId))) {
            await this.getAccount(this.masterAccountId).createSubAccount(this.rootAccountId);
        }
        return this;
    }
    async createTopLevelAccountWithHelper(accountId, keyPair) {
        await this.urlAccountCreator.createAccount(accountId, keyPair.getPublicKey());
    }
    async createAccount(accountId, keyPair) {
        if (accountId.includes('.')) {
            await this.getParentAccount(accountId).createAccount(accountId, { keyPair });
            this.accountsCreated.delete(accountId);
        }
        else {
            await this.createTopLevelAccountWithHelper(accountId, keyPair !== null && keyPair !== void 0 ? keyPair : await this.getRootKey());
            (0, internal_utils_1.debug)(`Created account ${accountId} with account creator`);
        }
        return this.getAccount(accountId);
    }
    async addFundsFromNetwork(accountId = this.fullRootAccountId) {
        const temporaryId = (0, utils_1.randomAccountId)();
        try {
            const key = await this.getRootKey();
            const account = await this.createAccount(temporaryId, key);
            await account.delete(accountId, key);
        }
        catch (error) {
            if (error instanceof Error) {
                await this.removeKey(temporaryId);
            }
            throw error;
        }
    }
    async addFunds(accountId, amount) {
        const parent = this.getParentAccount(accountId);
        if (parent.accountId === accountId) {
            return this.addFundsFromNetwork(accountId);
        }
        if (!(await this.canCoverBalance(parent, amount))) {
            await this.addFunds(parent.accountId, amount);
        }
        await parent.transfer(accountId, amount);
    }
    async deleteAccounts(accounts, beneficiaryId) {
        var _a;
        const keyPair = (_a = await this.getKey(this.rootAccountId)) !== null && _a !== void 0 ? _a : undefined;
        return Promise.all(accounts.map(async (accountId) => {
            await this.deleteAccount(accountId, beneficiaryId, keyPair);
            await this.deleteKey(accountId);
        }));
    }
    async createFrom(config) {
        const currentRunAccount = TestnetManager.numTestAccounts;
        const prefix = currentRunAccount === 0 ? '' : currentRunAccount;
        TestnetManager.numTestAccounts += 1;
        const newConfig = { ...config, rootAccount: `t${prefix}.${config.rootAccountId}` };
        return (new TestnetManager(newConfig)).init();
    }
    async cleanup() {
        return this.deleteAccounts([...this.accountsCreated.values()], this.rootAccountId);
    }
    async needsFunds(accountId, amount) {
        return !amount.isZero() && this.isRootOrTLAccount(accountId)
            && (!await this.canCoverBalance(accountId, amount));
    }
    isRootOrTLAccount(accountId) {
        return this.rootAccountId === accountId || (0, utils_1.isTopLevelAccount)(accountId);
    }
}
exports.TestnetManager = TestnetManager;
TestnetManager.KEYSTORE_PATH = path.join(process.cwd(), '.near-credentials', 'workspaces');
TestnetManager.numTestAccounts = 0;
class SandboxManager extends AccountManager {
    async init() {
        if (!await this.getKey(this.rootAccountId)) {
            await this.setKey(this.rootAccountId, await (0, utils_2.getKeyFromFile)(this.keyFilePath));
        }
        return this;
    }
    async createFrom(config) {
        return new SandboxManager(config);
    }
    get DEFAULT_INITIAL_BALANCE() {
        return near_units_1.NEAR.parse('200 N').toJSON();
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
    async transact(keyPair) {
        const executionResult = await this.manager.executeTransaction(this, keyPair);
        if (executionResult.succeeded && this.delete) {
            await this.manager.deleteKey(this.receiverId);
        }
        return executionResult;
    }
}
exports.ManagedTransaction = ManagedTransaction;
//# sourceMappingURL=account-manager.js.map