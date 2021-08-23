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
exports.ManagedTransaction = exports.SandboxManager = exports.TestnetSubaccountManager = exports.TestnetManager = exports.AccountManager = void 0;
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const nearAPI = __importStar(require("near-api-js"));
const utils_1 = require("../utils");
const types_1 = require("../types");
const utils_2 = require("../runtime/utils");
const transaction_1 = require("../runtime/transaction");
const provider_1 = require("../provider");
const account_1 = require("./account");
const utils_3 = require("./utils");
async function findAccountsWithPrefix(prefix, keyStore, network) {
    const accounts = await keyStore.getAccounts(network);
    utils_2.debug(`Looking ${prefix} in ${accounts.join('\n')}`);
    const paths = accounts.filter(f => f.startsWith(prefix));
    utils_2.debug(`found [${paths.join(', ')}]`);
    if (paths.length > 0) {
        return paths;
    }
    return [`${utils_1.randomAccountId(prefix)}`];
}
class AccountManager {
    constructor(near) {
        this.near = near;
        this.accountsCreated = new Map();
    }
    static async create(near) {
        let manager;
        const { network } = near.config;
        switch (network) {
            case 'sandbox':
                manager = new SandboxManager(near);
                break;
            case 'testnet':
                manager = new TestnetManager(near);
                break;
            default: throw new Error(`Bad network id: ${network} expected "testnet" or "sandbox"`);
        }
        return manager.init();
    }
    getAccount(accountId) {
        return new account_1.Account(accountId, this);
    }
    async deleteKey(account_id) {
        utils_2.debug(`About to delete key for ${account_id}`);
        await this.keyStore.removeKey(this.networkId, account_id);
        utils_2.debug('deleted Key');
    }
    async init() {
        return this;
    }
    get root() {
        return new account_1.Account(this.rootAccountId, this);
    }
    get initialBalance() {
        var _a;
        return (_a = this.near.config.initialBalance) !== null && _a !== void 0 ? _a : this.DEFAULT_INITIAL_BALANCE;
    }
    get provider() {
        return provider_1.JSONRpc.from(this.near.config);
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
        return this.provider.account_balance(utils_1.asId(account));
    }
    async exists(accountId) {
        return this.provider.accountExists(utils_1.asId(accountId));
    }
    async executeTransaction(tx, keyPair) {
        const account = new nearAPI.Account(this.connection, tx.senderId);
        let oldKey = null;
        if (keyPair) {
            oldKey = await this.getKey(account.accountId);
        }
        // @ts-expect-error access shouldn't be protected
        const outcome = await account.signAndSendTransaction({ receiverId: tx.receiverId, actions: tx.actions });
        if (oldKey) {
            await this.setKey(account.accountId, oldKey);
        }
        return outcome;
    }
    addAccountCreated(account, sender) {
        const short = account.replace(`.${sender}`, '');
        this.accountsCreated.set(account, short);
    }
    get rootAccountId() {
        return this.near.config.rootAccount;
    }
    get keyStore() {
        var _a;
        return (_a = this.near.config.keyStore) !== null && _a !== void 0 ? _a : this.defaultKeyStore;
    }
    get signer() {
        return new nearAPI.InMemorySigner(this.keyStore);
    }
    get networkId() {
        return this.near.config.network;
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
        throw new Error('Method not implemented.');
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
        this.near.config.helperUrl);
        await accountCreator.createAccount(accountId, pubKey);
        return this.getAccount(accountId);
    }
    async addFunds() {
        const temporaryId = utils_1.randomAccountId();
        console.log(temporaryId);
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
            utils_2.debug(`Added masterAccount ${accountId}
          https://explorer.testnet.near.org/accounts/${this.rootAccountId}`);
        }
        if (new types_1.BN((await this.root.balance()).available).lt(new types_1.BN(utils_1.toYocto('100')))) {
            await this.addFunds();
        }
    }
    async initRootAccount() {
        if (this.near.config.rootAccount) {
            return;
        }
        const fileName = utils_3.findCallerFile();
        const p = path.parse(fileName);
        if (['.ts', '.js'].includes(p.ext)) {
            let { name } = p;
            if (name.includes('.')) {
                name = name.split('.')[0];
            }
            const accounts = await findAccountsWithPrefix(name, this.keyStore, this.networkId);
            const accountId = accounts.shift();
            await Promise.all(accounts.map(async (acc) => {
                await this.deleteAccount(acc, accountId);
            }));
            this.near.config.rootAccount = accountId;
            return;
        }
        throw new Error(`Bad filename/account name passed: ${fileName}`);
    }
    async createFrom(near) {
        const config = { ...near.config, rootAccount: this.rootAccountId };
        return (new TestnetSubaccountManager({ ...near, config })).init();
    }
}
exports.TestnetManager = TestnetManager;
TestnetManager.KEYSTORE_PATH = path.join(os.homedir(), '.near-credentials', 'near-runner');
TestnetManager.KEY_DIR_PATH = path.join(TestnetManager.KEYSTORE_PATH, 'testnet');
class TestnetSubaccountManager extends TestnetManager {
    get rootAccountId() {
        return this.subAccount;
    }
    get realRoot() {
        return this.getAccount(this.near.config.rootAccount);
    }
    async init() {
        const root = this.realRoot;
        this.subAccount = root.makeSubAccount(utils_1.randomAccountId('sub'));
        await this.realRoot.createAccount(this.subAccount);
        return this;
    }
}
exports.TestnetSubaccountManager = TestnetSubaccountManager;
class SandboxManager extends AccountManager {
    async init() {
        if (!await this.getKey(this.rootAccountId)) {
            await this.setKey(this.rootAccountId, await utils_2.getKeyFromFile(this.keyFilePath));
        }
        return this;
    }
    async createFrom(near) {
        return new SandboxManager(near);
    }
    get DEFAULT_INITIAL_BALANCE() {
        return utils_1.toYocto('200');
    }
    get defaultKeyStore() {
        const keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(this.near.config.homeDir);
        return keyStore;
    }
    get keyFilePath() {
        return path.join(this.near.config.homeDir, 'validator_key.json');
    }
}
exports.SandboxManager = SandboxManager;
class ManagedTransaction extends transaction_1.Transaction {
    constructor(manager, sender, receiver) {
        super(sender, receiver);
        this.manager = manager;
        this.delete = true;
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
            console.log(executionResult);
            await this.manager.deleteKey(this.receiverId);
        }
        return executionResult;
    }
}
exports.ManagedTransaction = ManagedTransaction;
//# sourceMappingURL=account-manager.js.map