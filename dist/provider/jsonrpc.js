"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONRpc = void 0;
const buffer_1 = require("buffer");
const bn_js_1 = __importDefault(require("bn.js"));
const types_1 = require("../types");
class JSONRpc extends types_1.JsonRpcProvider {
    static from(config) {
        const url = typeof config === 'string' ? config : config.rpcAddr;
        if (!this.providers.has(url)) {
            this.providers.set(url, new JSONRpc(url));
        }
        return this.providers.get(url);
    }
    async viewCode(account_id) {
        const codeResponse = await this.query({
            request_type: 'view_code',
            finality: 'final',
            account_id,
        });
        return buffer_1.Buffer.from(codeResponse.code_base64, 'base64');
    }
    async viewAccount(account_id) {
        return this.query({
            request_type: 'view_account',
            account_id,
            finality: 'optimistic',
        });
    }
    async accountExists(account_id) {
        try {
            await this.viewAccount(account_id);
            return true;
        }
        catch {
            return false;
        }
    }
    async protocolConfig() {
        return this.experimental_protocolConfig({
            finality: 'final',
        });
    }
    async account_balance(account_id) {
        const config = await this.protocolConfig();
        const state = await this.viewAccount(account_id);
        const costPerByte = new bn_js_1.default(config.runtime_config.storage_amount_per_byte);
        const stateStaked = new bn_js_1.default(state.storage_usage).mul(costPerByte);
        const staked = new bn_js_1.default(state.locked);
        const totalBalance = new bn_js_1.default(state.amount).add(staked);
        const availableBalance = totalBalance.sub(bn_js_1.default.max(staked, stateStaked));
        return {
            total: totalBalance.toString(),
            stateStaked: stateStaked.toString(),
            staked: staked.toString(),
            available: availableBalance.toString(),
        };
    }
    async view_call(account_id, method_name, args) {
        return this.query({
            request_type: 'call_function',
            account_id,
            method_name,
            args_base64: buffer_1.Buffer.from(JSON.stringify(args)).toString('base64'),
            finality: 'optimistic',
        });
    }
    async viewState(account_id, prefix, blockQuery) {
        const { values } = await this.query({
            request_type: 'view_state',
            ...(blockQuery !== null && blockQuery !== void 0 ? blockQuery : { finality: 'optimistic' }),
            account_id,
            prefix_base64: buffer_1.Buffer.from(prefix).toString('base64'),
        });
        return values.map(({ key, value }) => ({
            key: buffer_1.Buffer.from(key, 'base64'),
            value: buffer_1.Buffer.from(value, 'base64'),
        }));
    }
    async sandbox_patch_state(records) {
        return this.sendJsonRpc('sandbox_patch_state', records);
    }
}
exports.JSONRpc = JSONRpc;
JSONRpc.providers = new Map();
//# sourceMappingURL=jsonrpc.js.map