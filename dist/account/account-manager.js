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
const process = __importStar(require("process"));
const nearAPI = __importStar(require("near-api-js"));
const utils_1 = require("../utils");
const types_1 = require("../types");
const internal_utils_1 = require("../internal-utils");
const transaction_1 = require("../transaction");
const jsonrpc_1 = require("../jsonrpc");
const transaction_result_1 = require("../transaction-result");
const account_1 = require("./account");
const utils_2 = require("./utils");
function timeSuffix(prefix, length = 99999) {
    return `${prefix}${Date.now() % length}`;
}
async function findAccountsWithPrefix(prefix, keyStore, network) {
    const accounts = await keyStore.getAccounts(network);
    (0, internal_utils_1.debug)(`HOME: ${os.homedir()}\nPWD: ${process.cwd()}\nLooking for ${prefix} in:\n  ${accounts.join('\n  ')}`);
    const paths = accounts.filter(f => f.startsWith(prefix));
    (0, internal_utils_1.debug)(`Found:\n  ${paths.join('\n  ')}`);
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
            default: throw new Error(`Bad network id: "${network}"; expected "testnet" or "sandbox"`);
        }
    }
    getAccount(accountId) {
        return new account_1.Account(accountId, this);
    }
    getParentAccount(accountId) {
        return this.getAccount(accountId.split('.').slice(1).join('.'));
    }
    async deleteKey(account_id) {
        (0, internal_utils_1.debug)(`About to delete key for ${account_id}`);
        await this.keyStore.removeKey(this.networkId, account_id);
        (0, internal_utils_1.debug)('deleted Key');
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
    get provider() {
        return jsonrpc_1.JSONRpc.from(this.config);
    }
    createTransaction(sender, receiver) {
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
        (0, internal_utils_1.debug)(`setting keys for ${accountId}`);
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
        return this.provider.account_balance((0, utils_1.asId)(account));
    }
    async exists(accountId) {
        return this.provider.accountExists((0, utils_1.asId)(accountId));
    }
    async canCoverInitBalance(accountId) {
        const balance = new types_1.BN((await this.balance(accountId)).available);
        return balance.gt(new types_1.BN(this.initialBalance));
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
            const outcome = await account.signAndSendTransaction({ receiverId: tx.receiverId, actions: tx.actions, returnError: false });
            const end = Date.now();
            if (oldKey) {
                await this.setKey(account.accountId, oldKey);
            }
            else if (keyPair) {
                await this.deleteKey(tx.senderId);
            }
            const result = new transaction_result_1.TransactionResult(outcome, start, end);
            (0, internal_utils_1.txDebug)(result.summary());
            return result;
        }
        catch (error) {
            if (error instanceof Error) {
                const key = await this.getPublicKey(tx.receiverId);
                (0, internal_utils_1.debug)(`TX FAILED: receiver ${tx.receiverId} with key ${(_a = key === null || key === void 0 ? void 0 : key.toString()) !== null && _a !== void 0 ? _a : 'MISSING'} ${JSON.stringify(tx.actions).slice(0, 200)}`);
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
        return (0, utils_1.toYocto)('10');
    }
    get defaultKeyStore() {
        return TestnetManager.defaultKeyStore;
    }
    async init() {
        await this.createAndFundAccount();
        return this;
    }
    async createAccount(accountId, keyPair) {
        if (accountId.includes('.')) {
            await this.getParentAccount(accountId).createAccount(accountId, { keyPair });
            this.accountsCreated.delete(accountId);
        }
        else {
            const accountCreator = new nearAPI.accountCreator.UrlAccountCreator({}, // ignored
            this.config.helperUrl);
            await accountCreator.createAccount(accountId, keyPair.getPublicKey());
        }
        return this.getAccount(accountId);
    }
    async addFunds(accountId = this.rootAccountId) {
        const temporaryId = (0, utils_1.randomAccountId)();
        (0, internal_utils_1.debug)(`adding funds to ${this.rootAccountId} using ${temporaryId}`);
        const keyPair = await this.getRootKey();
        const { keyStore } = this;
        await keyStore.setKey(this.networkId, temporaryId, keyPair);
        const account = await this.createAccount(temporaryId, keyPair);
        await account.delete(accountId);
    }
    async createAndFundAccount() {
        await this.initRootAccount();
        const accountId = this.rootAccountId;
        if (!(await this.provider.accountExists(accountId))) {
            const keyPair = await this.getRootKey();
            const { keyStore } = this;
            await keyStore.setKey(this.networkId, accountId, keyPair);
            await this.createAccount(accountId, keyPair);
            (0, internal_utils_1.debug)(`Added masterAccount ${accountId}
          https://explorer.testnet.near.org/accounts/${this.rootAccountId}`);
        }
        if (new types_1.BN((await this.root.balance()).available).lt(new types_1.BN((0, utils_1.toYocto)('499')))) {
            await this.addFunds();
        }
    }
    async deleteAccounts(accounts, beneficiaryId) {
        return Promise.all(accounts.map(async (acc) => {
            await this.deleteAccount(acc, beneficiaryId);
        }));
    }
    async initRootAccount() {
        if (this.config.rootAccount !== undefined) {
            return;
        }
        const fileName = (0, utils_2.findCallerFile)()[0];
        const p = path.parse(fileName);
        if (['.ts', '.js'].includes(p.ext)) {
            const hash = (0, utils_2.sanitize)((0, utils_2.hashPathBase64)(fileName));
            const currentRootNumber = TestnetManager.numRootAccounts === 0 ? '' : `${TestnetManager.numRootAccounts}`;
            TestnetManager.numRootAccounts++;
            const name = `r${currentRootNumber}${hash.slice(0, 6)}`;
            const accounts = await findAccountsWithPrefix(name, this.keyStore, this.networkId);
            const accountId = accounts.shift();
            await this.deleteAccounts(accounts, accountId);
            this.config.rootAccount = accountId;
            return;
        }
        throw new Error(`Bad filename name passed by callsites: ${fileName}`);
    }
    async createFrom(config) {
        var _a;
        const currentRunAccount = TestnetManager.numTestAccounts;
        const prefix = currentRunAccount === 0 ? '' : currentRunAccount;
        TestnetManager.numTestAccounts += 1;
        const newConfig = { ...config, rootAccount: `t${prefix}.${config.rootAccount}` };
        if (!await this.exists(newConfig.rootAccount)) {
            const balance = await this.balance(this.rootAccountId);
            if (new types_1.BN(balance.available).lt(new types_1.BN((_a = newConfig.initialBalance) !== null && _a !== void 0 ? _a : (0, utils_1.toYocto)('25')))) {
                await this.addFunds(this.rootAccountId);
            }
        }
        return (new TestnetManager(newConfig)).init();
    }
    async cleanup() {
        return this.deleteAccounts([...this.accountsCreated.values()], this.rootAccountId);
    }
    async executeTransaction(tx, keyPair) {
        if (tx.accountCreated) {
            // Delete new account if it exists
            if (await this.exists(tx.receiverId)) {
                const account = new nearAPI.Account(this.connection, tx.senderId);
                const deleteTx = this.createTransaction(tx.receiverId, tx.receiverId).deleteAccount(tx.senderId);
                // @ts-expect-error access shouldn't be protected
                await account.signAndSendTransaction({ receiverId: tx.receiverId, actions: deleteTx.actions });
            }
            // Add funds to root account sender if needed.
            if (this.rootAccountId === tx.senderId && !(await this.canCoverInitBalance(tx.senderId))) {
                await this.addFunds(tx.senderId);
            }
            // Add root's key as a full access key to new account
            tx.addKey((await this.getPublicKey(tx.senderId)));
        }
        return super.executeTransaction(tx, keyPair);
    }
}
exports.TestnetManager = TestnetManager;
TestnetManager.KEYSTORE_PATH = path.join(process.cwd(), '.near-credentials');
TestnetManager.numRootAccounts = 0;
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
        return (0, utils_1.toYocto)('200');
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
        if (executionResult.succeeded && this.delete) {
            await this.manager.deleteKey(this.receiverId);
        }
        return executionResult;
    }
}
exports.ManagedTransaction = ManagedTransaction;
//# sourceMappingURL=account-manager.js.map