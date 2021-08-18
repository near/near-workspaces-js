import BN from 'bn.js';
import { FinalExecutionOutcome, ExecutionOutcome } from './provider';
import { KeyPair } from './types';
export declare const ONE_NEAR: BN;
export declare function toYocto(amount: string): string;
export declare function createKeyPair(): KeyPair;
export declare function tGas(s: string): string;
interface SuccessResult {
    status: {
        SuccessValue: string;
    };
}
export declare function assertSuccessResult(result: ExecutionOutcome): result is ExecutionOutcome & SuccessResult;
export declare function assertSuccessResult(result: FinalExecutionOutcome): result is FinalExecutionOutcome & SuccessResult;
export {};
