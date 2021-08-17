export * from './runner';
export * from './runtime';
export * from './utils';
export * from './types';
import _BN from "bn.js";
export { BN };
declare class BN extends _BN {
    toJSON(): string;
}
