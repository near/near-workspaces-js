/// <reference types="node" />
import { Buffer } from 'buffer';
import { Records } from './record';
import { JSONRpc, AccountView, NearProtocolConfig, AccountBalance, CodeResult, BlockId, Finality, StateItem, Empty, PublicKey, Network } from './types';
/**
 * Extends the main provider class in near-api-js, adding more methods for
 * interacting with an endpoint.
 */
export declare class JsonRpcProvider extends JSONRpc {
    private static readonly providers;
    /**
     * Create a JsonRpcProvider from config or rpcAddr
     * @param config rpc endpoint URL or a configuration that includes one.
     * @returns JsonRpcProvider
     */
    static from(config: string | {
        rpcAddr: string;
    }): JsonRpcProvider;
    static fromNetwork(network: Network): JsonRpcProvider;
    /**
     * Download the binary of a given contract.
     * @param accountId contract account
     * @returns Buffer of Wasm binary
     */
    viewCode(accountId: string, blockQuery?: {
        block_id: BlockId;
    } | {
        finality: Finality;
    }): Promise<Buffer>;
    /**
     * Download the binary of a given contract.
     * @param accountId contract account
     * @returns Base64 string of Wasm binary
     */
    viewCodeRaw(accountId: string, blockQuery?: {
        block_id: BlockId;
    } | {
        finality: Finality;
    }): Promise<string>;
    viewAccount(accountId: string, blockQuery?: {
        block_id: BlockId;
    } | {
        finality: Finality;
    }): Promise<AccountView>;
    accountExists(accountId: string, blockQuery?: {
        block_id: BlockId;
    } | {
        finality: Finality;
    }): Promise<boolean>;
    viewAccessKey(accountId: string, publicKey: PublicKey | string, blockQuery?: {
        block_id: BlockId;
    } | {
        finality: Finality;
    }): Promise<any>;
    protocolConfig(blockQuery?: {
        block_id: BlockId;
    } | {
        finality: Finality;
    }): Promise<NearProtocolConfig>;
    accountBalance(accountId: string, blockQuery?: {
        block_id: BlockId;
    } | {
        finality: Finality;
    }): Promise<AccountBalance>;
    viewCall(accountId: string, methodName: string, args: Record<string, unknown> | Uint8Array, blockQuery?: {
        block_id: BlockId;
    } | {
        finality: Finality;
    }): Promise<CodeResult>;
    /**
     * Get full response from RPC about result of view method
     * @param accountId
     * @param methodName
     * @param args Base64 encoded string
     * @param blockQuery
     * @returns
     */
    viewCallRaw(accountId: string, methodName: string, args: string, blockQuery?: {
        block_id: BlockId;
    } | {
        finality: Finality;
    }): Promise<CodeResult>;
    /**
     * Download the state of a contract given a prefix of a key.
     *
     * @param accountId contract account to lookup
     * @param prefix string or byte prefix of keys to loodup
     * @param blockQuery state at what block, defaults to most recent final block
     * @returns raw RPC response
     */
    viewState(accountId: string, prefix: string | Uint8Array, blockQuery?: {
        block_id: BlockId;
    } | {
        finality: Finality;
    }): Promise<Array<{
        key: Buffer;
        value: Buffer;
    }>>;
    /**
     * Download the state of a contract given a prefix of a key without decoding from base64.
     *
     * @param accountId contract account to lookup
     * @param prefix string or byte prefix of keys to loodup
     * @param blockQuery state at what block, defaults to most recent final block
     * @returns raw RPC response
     */
    viewStateRaw(accountId: string, prefix: string | Uint8Array, blockQuery?: {
        block_id: BlockId;
    } | {
        finality: Finality;
    }): Promise<StateItem[]>;
    /**
     * Updates records without using a transaction.
     * Note: only avaialable on Sandbox endpoints.
     * @param records
     * @returns Promise<Empty>
     */
    patchStateRecords(records: Records): Promise<Empty>;
}
export declare const TestnetRpc: JsonRpcProvider;
export declare const MainnetRpc: JsonRpcProvider;
//# sourceMappingURL=jsonrpc.d.ts.map