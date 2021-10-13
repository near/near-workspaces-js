import {Buffer} from 'buffer';
import BN from 'bn.js';
import * as nearAPI from 'near-api-js';
import sha256 from 'js-sha256';
import bs58 from 'bs58';
import {NamedAccount, KeyPair, ClientConfig} from './types';

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

export const NO_DEPOSIT = new BN('0');

export async function captureError(fn: () => Promise<any>): Promise<string> {
  try {
    await fn();
  } catch (error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
  }

  throw new Error('fn succeeded when expected to throw an exception');
}

export function isTopLevelAccount(accountId: string): boolean {
  return accountId.includes('.');
}

function configFromDomain(network: 'testnet' | 'mainnet'): ClientConfig {
  return {
    network,
    rpcAddr: `https://archival-rpc.${network}.near.org`,
    walletUrl: `https://wallet.${network}.near.org`,
    helperUrl: `https://helper.${network}.near.org`,
    explorerUrl: `https://explorer.${network}.near.org`,
    archivalUrl: `https://archival-rpc.${network}.near.org`,
  };
}

export function urlConfigFromNetwork(network: string | {network: string}): ClientConfig {
  const networkName = typeof network === 'string' ? network : network.network;
  switch (networkName) {
    case 'sandbox':
      return {
        network: 'sandbox',
        rpcAddr: 'http://localhost',
      };

    case 'testnet':
    case 'mainnet': return configFromDomain(networkName);
    default:
      throw new Error(`Got network ${networkName}, but only accept 'sandbox', 'testnet', and 'mainnet'`);
  }
}

/**
 *
 * @param contract Base64 encoded binary or Buffer.
 * @returns sha256 hash of contract.
 */
export function hashContract(contract: string | Buffer): string {
  const bytes = typeof contract === 'string' ? Buffer.from(contract, 'base64') : contract;
  const buffer = Buffer.from(sha256.sha256(bytes), 'hex');
  return bs58.encode(buffer);
}

export const EMPTY_CONTRACT_HASH = '11111111111111111111111111111111';
