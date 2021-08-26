import BN from 'bn.js';
import * as nearAPI from 'near-api-js';
import {NamedAccount, KeyPair} from './types';

export const ONE_NEAR = new BN('1' + '0'.repeat(24));

export function toYocto(amount: string): string {
  return nearAPI.utils.format.parseNearAmount(amount)!;
}

export function createKeyPair(): KeyPair {
  return nearAPI.utils.KeyPairEd25519.fromRandom();
}

export function tGas(x: string | number) {
  if (typeof x === 'string' && Number.isNaN(Number.parseInt(x, 10))) {
    throw new TypeError(
      `tGas expects a number or a number-like string; got: ${x}`,
    );
  }

  return String(x) + '0'.repeat(12);
}

// Create random number with at least 7 digits by default
export function randomAccountId(prefix = 'dev-', suffix = `-${(Math.floor(Math.random() * (9_999_999 - 1_000_000)) + 1_000_000)}`): string {
  return `${prefix}${Date.now()}${suffix}`;
}

export function asId(id: string | NamedAccount): string {
  return typeof id === 'string' ? id : id.accountId;
}
