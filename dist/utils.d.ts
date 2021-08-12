import BN from "bn.js";
import * as nearAPI from "near-api-js";
export declare const ONE_NEAR: BN;
export declare function toYocto(amount: string): string;
export declare function createKeyPair(): nearAPI.KeyPair;
export declare function tGas(s: string): string;
