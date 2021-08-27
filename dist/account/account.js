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
exports.Account = void 0;
const buffer_1 = require("buffer");
const bn_js_1 = __importDefault(require("bn.js"));
const borsh = __importStar(require("borsh"));
const types_1 = require("../types");
const contract_state_1 = require("../contract-state");
const utils_1 = require("../utils");
class Account {
    constructor(_accountId, manager) {
        this._accountId = _accountId;
        this.manager = manager;
    }
    async exists() {
        return this.provider.accountExists(this.accountId);
    }
    get provider() {
        return this.manager.provider;
    }
    get accountId() {
        return this._accountId;
    }
    async balance() {
        return this.manager.balance(this.accountId);
    }
    createTransaction(receiver) {
        return this.manager.createTransaction(this, receiver);
    }
    async getKey() {
        return this.manager.getKey(this.accountId);
    }
    async setKey(keyPair) {
        return (await this.manager.setKey(this.accountId, keyPair)).getPublicKey();
    }
    async createAccount(accountId, { keyPair, initialBalance, } = {}) {
        const tx = await this.internalCreateAccount(accountId, {
            keyPair,
            initialBalance,
        });
        await tx.signAndSend();
        return this.getAccount(accountId);
    }
    getAccount(accountId) {
        const id = this.makeSubAccount(accountId);
        return new Account(id, this.manager);
    }
    async createAndDeploy(accountId, wasm, { attachedDeposit = utils_1.NO_DEPOSIT, args = {}, gas = types_1.DEFAULT_FUNCTION_CALL_GAS, initialBalance, keyPair, method, } = {}) {
        let tx = await this.internalCreateAccount(accountId, {
            keyPair,
            initialBalance,
        });
        tx = await tx.deployContractFile(wasm);
        if (method) {
            tx.functionCall(method, args, { gas, attachedDeposit });
        }
        await tx.signAndSend();
        return this.getAccount(accountId);
    }
    async call_raw(contractId, methodName, args, { gas = types_1.DEFAULT_FUNCTION_CALL_GAS, attachedDeposit = utils_1.NO_DEPOSIT, signWithKey = undefined, } = {}) {
        return this.createTransaction(contractId)
            .functionCall(methodName, args, { gas, attachedDeposit })
            .signAndSend(signWithKey);
    }
    async call(contractId, methodName, args, { gas = types_1.DEFAULT_FUNCTION_CALL_GAS, attachedDeposit = utils_1.NO_DEPOSIT, signWithKey = undefined, } = {}) {
        const txResult = await this.call_raw(contractId, methodName, args, {
            gas,
            attachedDeposit,
            signWithKey,
        });
        return txResult.parseResult();
    }
    async view_raw(method, args = {}) {
        return this.provider.view_call(this.accountId, method, args);
    }
    async view(method, args = {}) {
        const result = await this.view_raw(method, args);
        if (result.result) {
            const value = buffer_1.Buffer.from(result.result).toString();
            try {
                return JSON.parse(value);
            }
            catch {
                return value;
            }
        }
        return result.result;
    }
    async viewState(prefix = '') {
        return new contract_state_1.ContractState(await this.provider.viewState(this.accountId, prefix));
    }
    async patchState(key, value_, borshSchema) {
        const data_key = buffer_1.Buffer.from(key).toString('base64');
        const value = buffer_1.Buffer.from(borshSchema ? borsh.serialize(borshSchema, value_) : value_).toString('base64');
        const account_id = this.accountId;
        return this.provider.sandbox_patch_state({
            records: [
                {
                    Data: {
                        account_id,
                        data_key,
                        value,
                    },
                },
            ],
        });
    }
    async delete(beneficiaryId) {
        return this.createTransaction(this)
            .deleteAccount(beneficiaryId)
            .signAndSend();
    }
    makeSubAccount(accountId) {
        if (this.subAccountOf(accountId)
            || this.manager.root.subAccountOf(accountId)) {
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
    async internalCreateAccount(accountId, { keyPair, initialBalance, } = {}) {
        const newAccountId = this.makeSubAccount(accountId);
        const pubKey = (await this.manager.setKey(newAccountId, keyPair)).getPublicKey();
        const amount = new bn_js_1.default(initialBalance !== null && initialBalance !== void 0 ? initialBalance : this.manager.initialBalance);
        return this.createTransaction(newAccountId)
            .createAccount()
            .transfer(amount)
            .addKey(pubKey);
    }
}
exports.Account = Account;
//# sourceMappingURL=account.js.map