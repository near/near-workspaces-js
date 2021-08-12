import BN from "bn.js";
import * as nearAPI from "near-api-js";


export const ONE_NEAR = new BN("1" + "0".repeat(24));

export function toYocto(amount: string): string {
  const base = new BN(amount);
  const res = base.mul(ONE_NEAR);
  return res.toString();
}


export function createKeyPair(): nearAPI.KeyPair {
  return nearAPI.utils.KeyPairEd25519.fromRandom();
}
