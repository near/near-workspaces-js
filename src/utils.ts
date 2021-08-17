import BN from 'bn.js';
import * as nearAPI from 'near-api-js';
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
