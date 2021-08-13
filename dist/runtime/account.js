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
exports.ContractState = exports.Account = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const borsh = __importStar(require("borsh"));
// TODO: import DEFAULT_FUNCTION_CALL_GAS from NAJ
const DEFAULT_FUNCTION_CALL_GAS = new bn_js_1.default(30 * 10 ** 12);
const NO_DEPOSIT = new bn_js_1.default('0');
class Account {
    constructor(najAccount) {
        this.najAccount = najAccount;
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
        return this.najAccount.accountId;
    }
    async balance() {
        return this.najAccount.getAccountBalance();
    }
    get provider() {
        return this.connection.provider;
    }
    async getKey(accountId) {
        return this.keyStore.getKey(this.networkId, accountId);
    }
    async setKey(accountId, keyPair) {
        await this.keyStore.setKey(this.networkId, accountId, keyPair);
    }
    /**
     * Call a NEAR contract and return full results with raw receipts, etc. Example:
     *
     *     await call('lol.testnet', 'set_status', { message: 'hello' }, new BN(30 * 10**12), '0')
     *
     * @returns nearAPI.providers.FinalExecutionOutcome
     */
    async call_raw(contractId, methodName, args, { gas = DEFAULT_FUNCTION_CALL_GAS, attachedDeposit = NO_DEPOSIT, signWithKey = undefined, } = {}) {
        const accountId = typeof contractId === "string" ? contractId : contractId.accountId;
        let oldKey;
        if (signWithKey) {
            oldKey = await this.getKey(accountId);
            await this.setKey(accountId, signWithKey);
        }
        const txResult = await this.najAccount.functionCall({
            contractId: accountId,
            methodName,
            args,
            gas: new bn_js_1.default(gas),
            attachedDeposit: new bn_js_1.default(attachedDeposit),
        });
        if (signWithKey) {
            await this.setKey(accountId, oldKey);
        }
        return txResult;
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
            signWithKey
        });
        if (typeof txResult.status === 'object' && typeof txResult.status.SuccessValue === 'string') {
            const value = Buffer.from(txResult.status.SuccessValue, 'base64').toString();
            try {
                return JSON.parse(value);
            }
            catch (e) {
                return value;
            }
        }
        throw JSON.stringify(txResult.status);
    }
    // async view_raw(method: string, args: Args = {}): Promise<CodeResult> {
    //   const res: CodeResult = await this.connection.provider.query({
    async view_raw(method, args = {}) {
        const res = await this.connection.provider.query({
            request_type: 'call_function',
            account_id: this.accountId,
            method_name: method,
            args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
            finality: 'optimistic'
        });
        return res;
    }
    async view(method, args = {}) {
        const res = await this.view_raw(method, args);
        if (res.result) {
            return JSON.parse(Buffer.from(res.result).toString());
        }
        return res.result;
    }
    async viewState() {
        return new ContractState(await this.najAccount.viewState(""));
    }
    async patchState(key, val, borshSchema) {
        const data_key = Buffer.from(key).toString('base64');
        let value = (borshSchema) ? borsh.serialize(borshSchema, val) : val;
        value = Buffer.from(value).toString('base64');
        const account_id = this.accountId;
        return this.provider.sendJsonRpc("sandbox_patch_state", {
            records: [
                {
                    "Data": {
                        account_id,
                        data_key,
                        value
                    }
                }
            ]
        });
    }
}
exports.Account = Account;
class ContractState {
    constructor(dataArray) {
        this.data = new Map();
        dataArray.forEach(({ key, value }) => {
            this.data.set(key.toString(), value);
        });
    }
    get_raw(key) {
        return this.data.get(key) || Buffer.from("");
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
//# sourceMappingURL=account.js.map