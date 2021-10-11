import BN from 'bn.js';
import { NamedAccount, KeyPair } from './types';
export declare const ONE_NEAR: BN;
export declare function toYocto(amount: string): string;
export declare function createKeyPair(): KeyPair;
export declare function tGas(x: string | number): string;
export declare function randomAccountId(prefix?: string, suffix?: string): string;
export declare function asId(id: string | NamedAccount): string;
export declare const NO_DEPOSIT: BN;
export declare function captureError(fn: () => Promise<any>): Promise<string>;
export declare function isTopLevelAccount(accountId: string): boolean;
//# sourceMappingURL=utils.d.ts.map