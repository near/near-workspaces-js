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
exports.Account = void 0;
const buffer_1 = require("buffer");
const process_1 = require("process");
const borsh = __importStar(require("borsh"));
const types_1 = require("../types");
const contract_state_1 = require("../contract-state");
const jsonrpc_1 = require("../jsonrpc");
const utils_1 = require("../utils");
const transaction_result_1 = require("../transaction-result");
const record_1 = require("../record");
class Account {
    constructor(_accountId, manager) {
        this._accountId = _accountId;
        this.manager = manager;
    }
    async accountView() {
        return this.manager.accountView(this._accountId);
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
    async availableBalance() {
        return this.manager.availableBalance(this.accountId);
    }
    async balance() {
        return this.manager.balance(this.accountId);
    }
    batch(receiver) {
        return this.manager.batch(this, receiver);
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
            isSubAccount: false,
        });
        const result = await tx.transact();
        if (result.Failure) {
            throw new Error(`Failure during trasaction excecution, details: ${JSON.stringify(result)}`);
        }
        return this.getAccount(accountId);
    }
    async createSubAccount(accountId, { keyPair, initialBalance, } = {}) {
        const tx = await this.internalCreateAccount(accountId, {
            keyPair,
            initialBalance,
            isSubAccount: true,
        });
        const result = await tx.transact();
        if (result.Failure) {
            throw new Error(`Failure during trasaction excecution, details: ${JSON.stringify(result)}`);
        }
        return this.getSubAccount(accountId);
    }
    async importContract({ testnetContract, mainnetContract, withData = false, blockId, keyPair, initialBalance, }) {
        if ((testnetContract && mainnetContract) || !(testnetContract || mainnetContract)) {
            throw new TypeError('Provide `mainnetContract` or `testnetContract` but not both.');
        }
        const network = mainnetContract ? 'mainnet' : 'testnet';
        const refContract = (mainnetContract !== null && mainnetContract !== void 0 ? mainnetContract : testnetContract);
        const rpc = jsonrpc_1.JsonRpcProvider.fromNetwork(network);
        const blockQuery = blockId ? { block_id: blockId } : undefined;
        const account = this.getAccount(refContract);
        // Get account view of account on reference network
        const accountView = await rpc.viewAccount(refContract, blockQuery);
        accountView.amount = initialBalance !== null && initialBalance !== void 0 ? initialBalance : accountView.amount;
        const pubKey = await account.setKey(keyPair);
        const records = account.recordBuilder()
            .account(accountView)
            .accessKey(pubKey);
        if (accountView.code_hash !== utils_1.EMPTY_CONTRACT_HASH) {
            const binary = await rpc.viewCodeRaw(refContract, blockQuery);
            records.contract(binary);
        }
        await account.patchStateRecords(records);
        if (!await this.provider.accountExists(refContract)) {
            await account.patchStateRecords(records);
            if (!await this.provider.accountExists(refContract)) {
                throw new Error(`Account ${refContract} does not exist after trying to patch into sandbox.`);
            }
        }
        if (withData) {
            const rawData = await rpc.viewStateRaw(account.accountId, '', blockQuery);
            const data = rawData.map(({ key, value }) => ({
                Data: {
                    account_id: account.accountId, data_key: key, value,
                },
            }));
            await account.patchStateRecords({ records: data });
        }
        return account;
    }
    getSubAccount(accountId) {
        const id = this.makeSubAccount(accountId);
        return this.getAccount(id);
    }
    getAccount(accountId) {
        return new Account(accountId, this.manager);
    }
    async deploy(code) {
        const tx = await this.batch(this).deployContractFile(code);
        return tx.transact();
    }
    async devDeploy(wasm, { attachedDeposit = utils_1.NO_DEPOSIT, args = {}, gas = types_1.DEFAULT_FUNCTION_CALL_GAS, initialBalance, keyPair, method, isSubAccount, } = {}) {
        const randomNumber = Math.floor((Math.random() * (9999 - 1000)) + 10000);
        const accountId = `dev-${randomNumber}.${this.accountId}`;
        let tx = await this.internalCreateAccount(accountId, {
            keyPair,
            initialBalance,
            isSubAccount,
        });
        tx = await tx.deployContractFile(wasm);
        if (method) {
            tx.functionCall(method, args, { gas, attachedDeposit });
        }
        const result = await tx.transact();
        if (result.Failure) {
            throw new Error(`Failure during trasaction excecution, details: ${JSON.stringify(result)}`);
        }
        return this.getAccount(accountId);
    }
    async callRaw(contractId, methodName, args, { gas = types_1.DEFAULT_FUNCTION_CALL_GAS, attachedDeposit = utils_1.NO_DEPOSIT, signWithKey = undefined, } = {}) {
        return this.batch(contractId)
            .functionCall(methodName, args, { gas, attachedDeposit })
            .transact(signWithKey);
    }
    async call(contractId, methodName, args, { gas = types_1.DEFAULT_FUNCTION_CALL_GAS, attachedDeposit = utils_1.NO_DEPOSIT, signWithKey = undefined, } = {}) {
        const txResult = await this.callRaw(contractId, methodName, args, {
            gas,
            attachedDeposit,
            signWithKey,
        });
        if (!process_1.env.NEAR_WORKSPACES_NO_LOGS && txResult.logs.length > 0) {
            const accId = typeof contractId === 'string' ? contractId : contractId.accountId;
            console.log(`Contract logs from ${accId}.${methodName}(${JSON.stringify(args)}) call:`, txResult.logs);
        }
        if (txResult.failed) {
            throw new transaction_result_1.TransactionError(txResult);
        }
        return txResult.parseResult();
    }
    async viewRaw(method, args = {}) {
        return this.provider.viewCall(this.accountId, method, args);
    }
    async view(method, args = {}) {
        const result = await this.viewRaw(method, args);
        if (!process_1.env.NEAR_WORKSPACES_NO_LOGS && result.logs.length > 0) {
            console.log(`Contract logs from ${this.accountId}.${method}(${JSON.stringify(args)}) view call:`, result.logs);
        }
        if (result.result) {
            const value = buffer_1.Buffer.from(result.result).toString();
            try {
                return JSON.parse(value);
            }
            catch {
                return value;
            }
        }
        return null;
    }
    async viewCode() {
        return this.provider.viewCode(this.accountId);
    }
    async viewCodeRaw() {
        return this.provider.viewCodeRaw(this.accountId);
    }
    async viewState(prefix = '') {
        return new contract_state_1.ContractState(await this.provider.viewState(this.accountId, prefix));
    }
    async viewStateRaw(prefix = '') {
        return this.provider.viewStateRaw(this.accountId, prefix);
    }
    async patchState(key, value_, borshSchema) {
        return this.updateData(buffer_1.Buffer.from(key), buffer_1.Buffer.from(borshSchema ? borsh.serialize(borshSchema, value_) : value_));
    }
    async patchStateRecords(records) {
        // FIX THIS: Shouldn't need two calls to update before next RPC view call.
        await this.provider.patchStateRecords(records);
        return this.provider.patchStateRecords(records);
    }
    async delete(beneficiaryId, keyPair) {
        const result = await this.batch(this)
            .deleteAccount(beneficiaryId)
            .transact(keyPair);
        if (result.succeeded && await this.getKey() !== null) {
            await this.manager.deleteKey(this.accountId);
        }
        return result;
    }
    makeSubAccount(accountId) {
        return `${accountId}.${this.accountId}`;
    }
    subAccountOf(accountId) {
        return accountId.endsWith(`.${this.accountId}`);
    }
    toJSON() {
        return this.accountId;
    }
    async updateAccount(accountData) {
        return this.patchStateRecords(this.recordBuilder().account(accountData));
    }
    async updateAccessKey(key, access_key_data) {
        return this.patchStateRecords(this.recordBuilder().accessKey(key, access_key_data));
    }
    async updateContract(binary) {
        const accountView = await this.accountView();
        const rb = this.recordBuilder();
        rb.account(accountView);
        return this.patchStateRecords(rb.contract(binary));
    }
    async updateData(key, value) {
        const key_string = key instanceof buffer_1.Buffer ? key.toString('base64') : key;
        const value_string = value instanceof buffer_1.Buffer ? value.toString('base64') : value;
        return this.patchStateRecords(this.recordBuilder().data(key_string, value_string));
    }
    async transfer(accountId, amount) {
        return this.batch(accountId).transfer(amount).transact();
    }
    async internalCreateAccount(accountId, { keyPair, initialBalance, isSubAccount, } = {}) {
        const newAccountId = isSubAccount ? this.makeSubAccount(accountId) : accountId;
        const pubKey = (await this.getOrCreateKey(newAccountId, keyPair)).getPublicKey();
        const amount = (initialBalance !== null && initialBalance !== void 0 ? initialBalance : this.manager.initialBalance).toString();
        return this.batch(newAccountId)
            .createAccount()
            .transfer(amount)
            .addKey(pubKey);
    }
    async getOrCreateKey(accountId, keyPair) {
        var _a;
        return (_a = (await this.manager.getKey(accountId))) !== null && _a !== void 0 ? _a : this.manager.setKey(accountId, keyPair);
    }
    recordBuilder() {
        return record_1.RecordBuilder.fromAccount(this);
    }
}
exports.Account = Account;
//# sourceMappingURL=account.js.map