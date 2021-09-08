import BN from 'bn.js';
import * as nearAPI from 'near-api-js';
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

export function urlConfigFromNetwork(network: string | {network: string; port?: number}): ClientConfig {
  const networkName = typeof network === 'string' ? network : network.network;
  switch (networkName) {
    case 'sandbox':
      if (typeof network === 'string') {
        throw new TypeError('Sandbox\'s network argument can\'t be a string');
      }

      if (network.port === undefined) {
        throw new TypeError('Sandbox\'s network.port is not defined');
      }
        return {
          network: 'sandbox',
          rpcAddr: `http://localhost:${network.port!}`,
        };

    case 'testnet': return {
      network: 'testnet',
      rpcAddr: 'https://rpc.testnet.near.org',
      walletUrl: 'https://wallet.testnet.near.org',
      helperUrl: 'https://helper.testnet.near.org',
      explorerUrl: 'https://explorer.testnet.near.org',
      archivalUrl: 'https://archival-rpc.testnet.near.org',
    };
    case 'mainnet': return {
      network: 'mainnet',
      rpcAddr: 'https://rpc.mainnet.near.org',
      walletUrl: 'https://wallet.mainnet.near.org',
      helperUrl: 'https://helper.mainnet.near.org',
      explorerUrl: 'https://explorer.mainnet.near.org',
      archivalUrl: 'https://archival-rpc.mainnet.near.org',
    };
    default:
      throw new Error(`Got network ${networkName}, but only accept 'sandbox', 'testnet', and 'mainnet'`);
  }
}
