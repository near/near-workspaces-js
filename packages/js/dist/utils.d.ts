/// <reference types="node" />
import { Buffer } from 'buffer';
import { type NamedAccount, type KeyPair, type ClientConfig, type KeyStore } from './types';
export declare const ONE_NEAR: bigint;
export declare function createKeyPair(): KeyPair;
export declare function randomAccountId(prefix?: string, dateLength?: number, suffixLength?: number): string;
export declare function asId(id: string | NamedAccount): string;
export declare const NO_DEPOSIT = 0n;
export declare function captureError(function_: () => Promise<any>): Promise<string>;
export declare function isTopLevelAccount(accountId: string): boolean;
export declare function urlConfigFromNetwork(network: string | {
    network: string;
    rpcAddr?: string;
}): ClientConfig;
/**
 *
 * @param contract Base64 encoded binary or Buffer.
 * @returns sha256 hash of contract.
 */
export declare function hashContract(contract: string | Buffer): string;
export declare const EMPTY_CONTRACT_HASH = "11111111111111111111111111111111";
/**
 *
 * @returns network to connect to. Default 'sandbox'
 */
export declare function getNetworkFromEnv(): 'sandbox' | 'testnet' | 'custom';
export declare function homeKeyStore(): KeyStore;
export declare function timeSuffix(prefix: string, length?: number): string;
export declare function parseNEAR(s: string): string;
//# sourceMappingURL=utils.d.ts.map