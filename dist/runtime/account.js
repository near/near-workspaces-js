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
exports.RuntimeTransaction = exports.Transaction = exports.ContractState = exports.Account = void 0;
const buffer_1 = require("buffer");
const fs = __importStar(require("fs/promises"));
const bn_js_1 = __importDefault(require("bn.js"));
const nearAPI = __importStar(require("near-api-js"));
const borsh = __importStar(require("borsh"));
const types_1 = require("../types");
const utils_1 = require("./utils");
const DEFAULT_FUNCTION_CALL_GAS = new bn_js_1.default(30 * (10 ** 12));
const NO_DEPOSIT = new bn_js_1.default('0');
class Account {
    constructor(_accountId, runtime, levelUp) {
        this._accountId = _accountId;
        this.runtime = runtime;
        this.levelUp = levelUp;
    }
    get najAccount() {
        return new nearAPI.Account(this.runtime.near.connection, this.accountId);
    }
    get connection() {
        return this.najAccount.connection;
    }
    get networkId() {
        return this.connection.networkId;
    }
    get signer() {
        return this.connection.signer;
    }
    get keyStore() {
        return this.signer.keyStore;
    }
    get accountId() {
        return this._accountId;
    }
    get prefix() {
        return this.levelUp ? this.accountId.replace(`.${this.levelUp}`, '') : this.accountId;
    }
    async balance() {
        return this.najAccount.getAccountBalance();
    }
    createTransaction(receiver) {
        return new RuntimeTransaction(this.runtime, this, receiver);
    }
    get provider() {
        return this.connection.provider;
    }
    async getKey(accountId) {
        return this.keyStore.getKey(this.networkId, this.makeSubAccount(accountId));
    }
    async setKey(accountId, keyPair) {
        await this.keyStore.setKey(this.networkId, this.makeSubAccount(accountId), keyPair);
    }
    async createAccount(accountId, { keyPair, initialBalance = this.runtime.config.initialBalance } = {}) {
        const tx = await this.internalCreateAccount(accountId, { keyPair, initialBalance });
        await tx.signAndSend();
        return this.getAccount(accountId);
    }
    /** Adds suffix to accountId if account isn't sub account or have full including top level account */
    getAccount(accountId) {
        const id = this.makeSubAccount(accountId);
        return new Account(id, this.runtime);
    }
    async createAndDeploy(accountId, wasm, { attachedDeposit = NO_DEPOSIT, args = {}, gas = DEFAULT_FUNCTION_CALL_GAS, initialBalance, keyPair, method, } = {}) {
        let tx = (await this.internalCreateAccount(accountId, { keyPair, initialBalance }));
        tx = await tx.deployContractFile(wasm);
        if (method) {
            tx.functionCall(method, args, { gas, attachedDeposit });
        }
        await tx.signAndSend();
        return this.getAccount(accountId);
    }
    /**
     * Call a NEAR contract and return full results with raw receipts, etc. Example:
     *
     *     await call('lol.testnet', 'set_status', { message: 'hello' }, new BN(30 * 10**12), '0')
     *
     * @returns nearAPI.providers.FinalExecutionOutcome
     */
    async call_raw(contractId, methodName, args, { gas = DEFAULT_FUNCTION_CALL_GAS, attachedDeposit = NO_DEPOSIT, signWithKey = undefined, } = {}) {
        return this.createTransaction(contractId)
            .functionCall(methodName, args, { gas, attachedDeposit })
            .signAndSend(signWithKey);
    }
    /**
     * Convenient wrapper around lower-level `call_raw` that returns only successful result of call, or throws error encountered during call.  Example:
     *
     *     await call('lol.testnet', 'set_status', { message: 'hello' }, new BN(30 * 10**12), '0')
     *
     * @returns any parsed return value, or throws with an error if call failed
     */
    async call(contractId, methodName, args, { gas = DEFAULT_FUNCTION_CALL_GAS, attachedDeposit = NO_DEPOSIT, signWithKey = undefined, } = {}) {
        const txResult = await this.call_raw(contractId, methodName, args, {
            gas,
            attachedDeposit,
            signWithKey,
        });
        if (typeof txResult.status === 'object' && typeof txResult.status.SuccessValue === 'string') {
            const value = buffer_1.Buffer.from(txResult.status.SuccessValue, 'base64').toString();
            try {
                return JSON.parse(value); // eslint-disable-line @typescript-eslint/no-unsafe-return
            }
            catch {
                return value;
            }
        }
        throw new Error(JSON.stringify(txResult.status));
    }
    async view_raw(method, args = {}) {
        const result = await this.connection.provider.query({
            request_type: 'call_function',
            account_id: this.accountId,
            method_name: method,
            args_base64: buffer_1.Buffer.from(JSON.stringify(args)).toString('base64'),
            finality: 'optimistic',
        });
        return result;
    }
    async view(method, args = {}) {
        const result = await this.view_raw(method, args);
        if (result.result) {
            return JSON.parse(buffer_1.Buffer.from(result.result).toString()); // eslint-disable-line @typescript-eslint/no-unsafe-return
        }
        return result.result;
    }
    async viewState() {
        return new ContractState(await this.najAccount.viewState(''));
    }
    async patchState(key, value_, borshSchema) {
        const data_key = buffer_1.Buffer.from(key).toString('base64');
        let value = (borshSchema) ? borsh.serialize(borshSchema, value_) : value_; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        value = buffer_1.Buffer.from(value).toString('base64');
        const account_id = this.accountId;
        return this.provider.sendJsonRpc('sandbox_patch_state', {
            records: [
                {
                    Data: {
                        account_id,
                        data_key,
                        value, // eslint-disable-line @typescript-eslint/no-unsafe-assignment
                    },
                },
            ]
        });
    }
    makeSubAccount(accountId) {
        if (this.subAccountOf(accountId) || this.runtime.getRoot().subAccountOf(accountId)) {
            return accountId;
        }
        return `${accountId}.${this.accountId}`;
    }
    subAccountOf(accountId) {
        return accountId.endsWith(`.${this.accountId}`);
    }
    toJSON() {
        return this.accountId;
    }
    async addKey(accountId, keyPair) {
        const id = this.makeSubAccount(accountId);
        let pubKey;
        if (keyPair) {
            const key = await nearAPI.InMemorySigner.fromKeyPair(this.networkId, id, keyPair);
            pubKey = await key.getPublicKey();
        }
        else {
            pubKey = await this.signer.createKey(id, this.networkId);
        }
        return pubKey;
    }
    async internalCreateAccount(accountId, { keyPair, initialBalance } = {}) {
        const newAccountId = this.makeSubAccount(accountId);
        const pubKey = await this.addKey(newAccountId, keyPair);
        const amount = new bn_js_1.default(initialBalance !== null && initialBalance !== void 0 ? initialBalance : this.runtime.config.initialBalance);
        return this.createTransaction(newAccountId).createAccount().transfer(amount).addKey(pubKey);
    }
}
exports.Account = Account;
class ContractState {
    constructor(dataArray) {
        this.data = new Map();
        for (const { key, value } of dataArray) {
            this.data.set(key.toString(), value);
        }
    }
    get_raw(key) {
        var _a;
        return (_a = this.data.get(key)) !== null && _a !== void 0 ? _a : buffer_1.Buffer.from('');
    }
    get(key, borshSchema) {
        const value = this.get_raw(key);
        if (borshSchema) {
            return borsh.deserialize(borshSchema.schema, borshSchema.type, value);
        }
        return value.toJSON();
    }
}
exports.ContractState = ContractState;
class Transaction {
    constructor(sender, receiver) {
        this.sender = sender;
        this.actions = [];
        this.receiverId
            = typeof receiver === 'string' ? receiver : receiver.accountId;
    }
    addKey(publicKey, accessKey = types_1.fullAccessKey()) {
        this.actions.push(types_1.addKey(types_1.PublicKey.from(publicKey), accessKey));
        return this;
    }
    createAccount() {
        this.actions.push(types_1.createAccount());
        return this;
    }
    deleteAccount(beneficiaryId) {
        this.actions.push(types_1.deleteAccount(beneficiaryId));
        return this;
    }
    deleteKey(publicKey) {
        this.actions.push(types_1.deleteKey(types_1.PublicKey.from(publicKey)));
        return this;
    }
    async deployContractFile(code) {
        return this.deployContract(utils_1.isPathLike(code) ? await fs.readFile(code) : code);
    }
    deployContract(code) {
        this.actions.push(types_1.deployContract(code));
        return this;
    }
    functionCall(methodName, args, { gas = DEFAULT_FUNCTION_CALL_GAS, attachedDeposit = NO_DEPOSIT, } = {}) {
        this.actions.push(types_1.functionCall(methodName, args, new bn_js_1.default(gas), new bn_js_1.default(attachedDeposit)));
        return this;
    }
    stake(amount, publicKey) {
        this.actions.push(types_1.stake(new bn_js_1.default(amount), types_1.PublicKey.from(publicKey)));
        return this;
    }
    transfer(amount) {
        this.actions.push(types_1.transfer(new bn_js_1.default(amount)));
        return this;
    }
    /**
     *
     * @param keyPair Temporary key to sign transaction
     * @returns
     */
    async signAndSend(keyPair) {
        let oldKey;
        if (keyPair) {
            oldKey = await this.sender.getKey(this.sender.accountId);
            await this.sender.setKey(this.sender.accountId, keyPair);
        }
        // @ts-expect-error signAndSendTransaction iscurrently protected
        const result = await this.sender.najAccount.signAndSendTransaction({
            receiverId: this.receiverId,
            actions: this.actions,
        });
        if (keyPair) {
            await this.sender.setKey(this.sender.accountId, oldKey);
        }
        return result;
    }
}
exports.Transaction = Transaction;
class RuntimeTransaction extends Transaction {
    constructor(runtime, sender, receiver) {
        super(sender, receiver);
        this.runtime = runtime;
    }
    createAccount() {
        this.runtime.addAccountCreated(this.receiverId, this.sender);
        return super.createAccount();
    }
    async signAndSend(keyPair) {
        return this.runtime.executeTransaction(async () => super.signAndSend(keyPair));
    }
}
exports.RuntimeTransaction = RuntimeTransaction;
//# sourceMappingURL=account.js.map