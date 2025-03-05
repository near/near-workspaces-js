import {Buffer} from 'buffer';
import * as process from 'process';
import * as os from 'os';
import * as path from 'path';
import * as nearAPI from 'near-api-js';
import sha256 from 'js-sha256';
import {base58} from '@scure/base';
import {
  type NamedAccount,
  type KeyPair,
  type ClientConfig,
  type KeyStore,
} from './types';

export const ONE_NEAR = BigInt(parseNEAR('1'));

export function createKeyPair(): KeyPair {
  return nearAPI.utils.KeyPairEd25519.fromRandom();
}

// Create random account with at least 33 digits by default
export function randomAccountId(prefix = 'dev-', dateLength = 13, suffixLength = 15): string {
  const suffix = Math.floor(Math.random() * (10 ** 22)) % (10 ** suffixLength);
  return `${timeSuffix(prefix, dateLength)}-${suffix}`;
}

export function asId(id: string | NamedAccount): string {
  return typeof id === 'string' ? id : id.accountId;
}

export const NO_DEPOSIT = 0n;

export async function captureError(function_: () => Promise<any>): Promise<string> {
  try {
    await function_();
  } catch (error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
  }

  throw new Error('fn succeeded when expected to throw an exception');
}

export function isTopLevelAccount(accountId: string): boolean {
  return !accountId.includes('.');
}

function configFromDomain(network: 'testnet' | 'mainnet' | 'custom'): ClientConfig {
  let rpcAddr = `https://archival-rpc.${network}.near.org`;
  if (network === 'mainnet' && process.env.NEAR_CLI_MAINNET_RPC_SERVER_URL) {
    rpcAddr = process.env.NEAR_CLI_MAINNET_RPC_SERVER_URL;
  } else if (network === 'testnet' && process.env.NEAR_CLI_TESTNET_RPC_SERVER_URL) {
    rpcAddr = process.env.NEAR_CLI_TESTNET_RPC_SERVER_URL;
  }

  return {
    network,
    rpcAddr,
    walletUrl: `https://wallet.${network}.near.org`,
    helperUrl: `https://helper.${network}.near.org`,
    explorerUrl: `https://explorer.${network}.near.org`,
    archivalUrl: `https://archival-rpc.${network}.near.org`,
  };
}

export function urlConfigFromNetwork(network: string | {network: string; rpcAddr?: string}): ClientConfig {
  const networkName = typeof network === 'string' ? network : network.network;
  const rpcAddr = typeof network === 'string' ? undefined : network.rpcAddr;
  switch (networkName) {
    case 'sandbox': {
      return {
        network: 'sandbox',
        rpcAddr: 'http://127.0.0.1',
      };
    }

    case 'custom': {
      return {
        network: 'custom',
        rpcAddr: rpcAddr!,
      };
    }

    case 'testnet':
    case 'mainnet': {
      return configFromDomain(networkName);
    }

    default: {
      throw new Error(`Got network ${networkName}, but only accept 'sandbox', 'testnet', 'mainnet' and 'custom'`);
    }
  }
}

/**
 *
 * @param contract Base64 encoded binary or Buffer.
 * @returns sha256 hash of contract.
 */
export function hashContract(contract: string | Buffer): string {
  const bytes = typeof contract === 'string' ? Buffer.from(contract, 'base64') : contract;
  const buffer = Buffer.from(sha256.sha256(new Uint8Array(bytes)), 'hex');
  return base58.encode(new Uint8Array(buffer));
}

export const EMPTY_CONTRACT_HASH = '11111111111111111111111111111111';

/**
 *
 * @returns network to connect to. Default 'sandbox'
 */
export function getNetworkFromEnv(): 'sandbox' | 'testnet' | 'custom' {
  const network = process.env.NEAR_WORKSPACES_NETWORK;
  switch (network) {
    case 'sandbox':
    case 'testnet':
    case 'custom': {
      return network;
    }

    case undefined: {
      return 'sandbox';
    }

    default: {
      throw new Error(
        `environment variable NEAR_WORKSPACES_NETWORK=${network} invalid; `
        + 'use \'testnet\', \'custom\', or \'sandbox\' (the default)',
      );
    }
  }
}

export function homeKeyStore(): KeyStore {
  return new nearAPI.keyStores.UnencryptedFileSystemKeyStore(
    path.join(os.homedir(), '.near-credentials'),
  );
}

export function timeSuffix(prefix: string, length = 6): string {
  return `${prefix}${Date.now() % (10 ** length)}`;
}

const NOT_NUMBER_OR_UNDERLINE = /[^\d_]/;

// Near-API func to parse NEAR into yoctoNEAR string with with check for not-null value. 1N = 10^24yocto
export function parseNEAR(s: string): string {
  const parsedNear = nearAPI.utils.format.parseNearAmount(s);

  if (parsedNear === null) {
    throw new Error(`Invalid NEAR amount: ${s}`);
  }

  return parsedNear;
}
