import BN from 'bn.js';
import { KeyPair } from './types';
export declare const ONE_NEAR: BN;
export declare function toYocto(amount: string): string;
export declare function createKeyPair(): KeyPair;
export declare function tGas(s: string): string;
