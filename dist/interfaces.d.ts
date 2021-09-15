import { ClientConfig, KeyStore } from './types';
import { NearAccount } from './account/near-account';
export interface Config extends ClientConfig {
    homeDir: string;
    port: number;
    init: boolean;
    rm: boolean;
    refDir: string | null;
    initFn?: CreateRunnerFn;
    keyStore?: KeyStore;
}
export interface NearRuntime {
    run(fn: RunnerFn): Promise<void>;
    createRun(fn: CreateRunnerFn): Promise<ReturnedAccounts>;
}
export interface RuntimeArg {
    runtime: NearRuntime;
    root: NearAccount;
}
export declare type ReturnedAccounts = Record<string, NearAccount>;
export interface AccountArgs extends ReturnedAccounts {
    root: NearAccount;
}
export declare type CreateRunnerFn = (args: RuntimeArg) => Promise<ReturnedAccounts>;
export declare type RunnerFn = (args: AccountArgs, runtime: NearRuntime) => Promise<void>;
