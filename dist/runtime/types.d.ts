import { BN, KeyPair } from '../types';
export interface KeyFilePrivate {
    private_key: string;
}
export interface KeyFileSecret {
    secret_key: string;
}
export declare type KeyFile = KeyFilePrivate | KeyFileSecret;
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
export interface AccountBalance {
    total: string;
    stateStaked: string;
    staked: string;
    available: string;
}
