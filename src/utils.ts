import {strict as assert} from 'assert';
import BN from 'bn.js';
import * as nearAPI from 'near-api-js';
import {FinalExecutionOutcome, ExecutionOutcome} from './provider';
import {KeyPair} from './types';

export const ONE_NEAR = new BN('1' + '0'.repeat(24));

export function toYocto(amount: string): string {
  return nearAPI.utils.format.parseNearAmount(amount)!;
}

export function createKeyPair(): KeyPair {
  return nearAPI.utils.KeyPairEd25519.fromRandom();
}

export function tGas(s: string) {
  return s + '0'.repeat(12);
}

// ExecutionStatus vs FinalExecutionStatus from NAJ:
// interface ExecutionStatus {
//   SuccessValue?: string;
//   SuccessReceiptId?: string;
//   Failure?: ExecutionError;
// }
// interface FinalExecutionStatus {
//     SuccessValue?: string;
//     Failure?: ExecutionError;
// }
// SuccessResult's `status` is really `ExecutionStatus | FinalExecutionStatus`,
// but with definite `SuccessValue: string`
// (ExecutionStatus currently not exported from NAJ)
interface SuccessResult {
  status: {SuccessValue: string};
}

interface OutcomeLike {
  status: string | {SuccessValue?: string};
}

export function assertSuccessResult(result: ExecutionOutcome): result is ExecutionOutcome & SuccessResult;
export function assertSuccessResult(result: FinalExecutionOutcome): result is FinalExecutionOutcome & SuccessResult;
export function assertSuccessResult<T extends OutcomeLike>(result: T): result is T & SuccessResult {
  const isSuccessful = typeof result.status === 'object'
    && typeof result.status.SuccessValue === 'string';
  assert(isSuccessful, `Expected result to be successful; got ${JSON.stringify(result.status)}`);
  return isSuccessful;
}
