import {BN, KeyPair} from '../types';

export interface KeyFilePrivate {
  private_key: string;
}

export interface KeyFileSecret {
  secret_key: string;
}

export type KeyFile = KeyFilePrivate | KeyFileSecret;

export type Args = Record<string, any>;

export const NO_DEPOSIT = new BN('0');

export interface NamedAccount {
  accountId: string;
}

export interface CallOptions {
  gas?: string | BN;
  attachedDeposit?: string | BN;
  signWithKey?: KeyPair;
}

export interface AccountBalance {
  total: string;
  stateStaked: string;
  staked: string;
  available: string;
}
