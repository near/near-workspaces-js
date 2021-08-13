import BN from "bn.js";
import * as nearAPI from "near-api-js";
import { KeyPair } from "./types";


export const ONE_NEAR = new BN("1" + "0".repeat(24));

const oneToNine = /^([0-9])\.([0-9])$/;

// TODO: Handle any valid number
export function toYocto(amount: string): string {
  let base: BN;
  if (amount.startsWith("0.")){
    const rightSide = amount.slice(2);
    if (rightSide.startsWith("0")) {
      throw new Error("current 0.0xxx is unsupported. Got: " + amount);
    }
    base = new BN(rightSide);
    return base.mul(ONE_NEAR).div(new BN("10")).toString();
  }
  base = new BN(amount);
  const res = base.mul(ONE_NEAR);
  return res.toString();
}


export function createKeyPair(): KeyPair {
  return nearAPI.utils.KeyPairEd25519.fromRandom();
}

export function tGas(s: string) { return s + '0'.repeat(12); }
