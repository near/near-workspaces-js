import BN from 'bn.js';
import { NamedAccount, KeyPair } from './types';
export declare const ONE_NEAR: BN;
export declare function toYocto(amount: string): string;
export declare function createKeyPair(): KeyPair;
export declare function tGas(s: string): string;
export declare function randomAccountId(prefix?: string, suffix?: string): string;
export declare function asId(id: string | NamedAccount): string;
