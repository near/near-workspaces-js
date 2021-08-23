import {Connection, FinalExecutionOutcome, KeyStore} from './types';
import {NearAccount} from './account/near-account';

export interface ClientConfig {
  network: 'sandbox' | 'testnet';
  rootAccount?: string;
  rpcAddr: string;
  helperUrl?: string;
  explorerUrl?: string;
  initialBalance?: string;
  walletUrl?: string;
}

export interface Config extends ClientConfig {
  homeDir: string;
  port: number;
  init: boolean;
  rm: boolean;
  refDir: string | null;
  initFn?: CreateRunnerFn;
  keyStore?: KeyStore;
}

export interface Provider {
  connection: Connection;
  initialBalance: string;
}

export interface NearRuntime {
  run(fn: RunnerFn): Promise<void>;
  createRun(fn: CreateRunnerFn): Promise<ReturnedAccounts>;
  // CreateAndRun(fn: RunnerFn, config?: Partial<Config>): Promise<void>;
}

export interface RuntimeArg {
  runtime: NearRuntime;
  root: NearAccount;
}

export type ReturnedAccounts = Record<string, NearAccount>;

export interface AccountArgs extends ReturnedAccounts {
  root: NearAccount;
}
export type CreateRunnerFn = (args: RuntimeArg) => Promise<ReturnedAccounts>;
export type RunnerFn = (args: AccountArgs, runtime: NearRuntime) => Promise<void>;

export interface NEAR {
  config: Config;
}
