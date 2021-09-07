"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonRpcProvider = void 0;
const buffer_1 = require("buffer");
const near_units_1 = require("near-units");
const types_1 = require("./types");
/**
 * Extends the main provider class in NAJ, adding more methods for
 * interacting with an endpoint.
 */
class JsonRpcProvider extends types_1.JSONRpc {
    /**
     *
     * @param config rpc endpoint URL or a configuration that includes one.
     * @returns
     */
    static from(config) {
        const url = typeof config === 'string' ? config : config.rpcAddr;
        if (!this.providers.has(url)) {
            this.providers.set(url, new JsonRpcProvider(url));
        }
        return this.providers.get(url);
    }
    /**
     * Download the binary of a given contract.
     * @param account_id contract account
     * @returns Buffer of Wasm binary
     */
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
        const cost = config.runtime_config.storage_amount_per_byte;
        const costPerByte = near_units_1.NEAR.from(cost);
        const stateStaked = near_units_1.NEAR.from(state.storage_usage).mul(costPerByte);
        const staked = near_units_1.NEAR.from(state.locked);
        const total = near_units_1.NEAR.from(state.amount).add(staked);
        const available = total.sub(staked.max(stateStaked));
        return {
            total,
            stateStaked,
            staked,
            available,
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
    /**
     * Download the state of a contract given a prefix of a key.
     *
     * @param account_id contract account to lookup
     * @param prefix string or byte prefix of keys to loodup
     * @param blockQuery state at what block, defaulty most recent final block
     * @returns
     */
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
    /**
     * Updates records without using a transaction.
     * Note: only avaialable on Sandbox endpoints.
     * @param records
     * @returns
     */
    async sandbox_patch_state(records) {
        return this.sendJsonRpc('sandbox_patch_state', records);
    }
}
exports.JsonRpcProvider = JsonRpcProvider;
JsonRpcProvider.providers = new Map();
//# sourceMappingURL=jsonrpc.js.map