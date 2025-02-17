/// <reference types="node" />
import { type ChildProcess } from 'child_process';
import { type KeyPair } from 'near-api-js';
import { type Output } from 'promisify-child-process';
import { type KeyStore } from 'near-api-js/lib/key_stores';
export { ServerError } from 'near-api-js/lib/utils/rpc_errors';
export { KeyPair, Connection } from 'near-api-js';
export { PublicKey, KeyPairEd25519 } from 'near-api-js/lib/utils';
export { Action, createAccount, deployContract, functionCall, transfer, stake, addKey, deleteKey, deleteAccount, fullAccessKey, AccessKey, } from 'near-api-js/lib/transaction';
export { JsonRpcProvider as JSONRpc } from 'near-api-js/lib/providers/json-rpc-provider';
export { KeyStore } from 'near-api-js/lib/key_stores';
export * from 'near-api-js/lib/providers/provider';
export { DEFAULT_FUNCTION_CALL_GAS } from 'near-api-js/lib/constants';
export type Args = Record<string, any> | Uint8Array;
export interface NamedAccount {
    accountId: string;
}
export interface CallOptions {
    gas?: bigint;
    attachedDeposit?: bigint;
    signWithKey?: KeyPair;
}
export type ChildProcessPromise = Promise<ChildProcess & Promise<Output>>;
export interface AccountBalance {
    total: string;
    stateStaked: string;
    staked: string;
    available: string;
}
export type Network = 'testnet' | 'mainnet' | 'sandbox' | 'custom';
export interface ClientConfig {
    network: Network;
    rootAccountId?: string;
    testnetMasterAccountId?: string;
    rpcAddr: string;
    apiKey?: string;
    helperUrl?: string;
    explorerUrl?: string;
    initialBalance?: bigint;
    walletUrl?: string;
    archivalUrl?: string;
}
export interface Config extends ClientConfig {
    homeDir: string;
    port: number;
    rm: boolean;
    refDir: string | null;
    keyStore?: KeyStore;
}
export declare const TESTNET_RPC_ADDR = "https://archival-rpc.testnet.near.org";
export declare const MAINNET_RPC_ADDR = "https://archival-rpc.mainnet.near.org";
export interface StateItem {
    key: string;
    value: string;
    proof: string[];
}
export type Empty = {};
//# sourceMappingURL=types.d.ts.map