import _BN from 'bn.js';
import { KeyPair } from 'near-api-js';
export { KeyPair, Connection } from 'near-api-js';
export { PublicKey, KeyPairEd25519 } from 'near-api-js/lib/utils';
export { Action, createAccount, deployContract, functionCall, transfer, stake, addKey, deleteKey, deleteAccount, fullAccessKey, AccessKey, } from 'near-api-js/lib/transaction';
export { AccountBalance } from 'near-api-js/lib/account';
export { JsonRpcProvider } from 'near-api-js/lib/providers/json-rpc-provider';
export { KeyStore } from 'near-api-js/lib/key_stores';
export * from 'near-api-js/lib/providers/provider';
export { DEFAULT_FUNCTION_CALL_GAS } from 'near-api-js/lib/constants';
export declare class BN extends _BN {
    toJSON(): string;
}
export declare type Args = Record<string, any>;
export declare const NO_DEPOSIT: BN;
export interface NamedAccount {
    accountId: string;
}
export interface CallOptions {
    gas?: string | BN;
    attachedDeposit?: string | BN;
    signWithKey?: KeyPair;
}
