/// <reference types="node" />
import { Buffer } from 'buffer';
import { Records } from './record';
import { JSONRpc, AccountView, NearProtocolConfig, AccountBalance, CodeResult, BlockId, Finality, Empty } from './types';
/**
 * Extends the main provider class in NAJ, adding more methods for
 * interacting with an endpoint.
 */
export declare class JsonRpcProvider extends JSONRpc {
    private static readonly providers;
    /**
     *
     * @param config rpc endpoint URL or a configuration that includes one.
     * @returns
     */
    static from(config: string | {
        rpcAddr: string;
    }): JsonRpcProvider;
    /**
     * Download the binary of a given contract.
     * @param account_id contract account
     * @returns Buffer of Wasm binary
     */
    viewCode(account_id: string): Promise<Buffer>;
    viewAccount(account_id: string): Promise<AccountView>;
    accountExists(account_id: string): Promise<boolean>;
    protocolConfig(): Promise<NearProtocolConfig>;
    account_balance(account_id: string): Promise<AccountBalance>;
    view_call(account_id: string, method_name: string, args: Record<string, unknown>): Promise<CodeResult>;
    /**
     * Download the state of a contract given a prefix of a key.
     *
     * @param account_id contract account to lookup
     * @param prefix string or byte prefix of keys to loodup
     * @param blockQuery state at what block, defaults to most recent final block
     * @returns raw RPC response
     */
    viewState(account_id: string, prefix: string | Uint8Array, blockQuery?: {
        blockId: BlockId;
    } | {
        finality: Finality;
    }): Promise<Array<{
        key: Buffer;
        value: Buffer;
    }>>;
    /**
     * Updates records without using a transaction.
     * Note: only avaialable on Sandbox endpoints.
     * @param records
     * @returns
     */
    sandbox_patch_state(records: Records): Promise<Empty>;
}
//# sourceMappingURL=jsonrpc.d.ts.map