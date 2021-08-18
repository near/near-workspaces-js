/// <reference types="node" />
import { Buffer } from 'buffer';
import * as nearAPI from 'near-api-js';
import { KeyPair } from '../types';
import { FinalExecutionOutcome } from '../provider';
import { Account } from './account';
interface RuntimeArg {
    runtime: Runtime;
    root: Account;
}
export declare type ReturnedAccounts = Record<string, Account>;
export interface AccountArgs extends ReturnedAccounts {
    root: Account;
}
export declare type CreateRunnerFn = (args: RuntimeArg) => Promise<ReturnedAccounts>;
export declare type RunnerFn = (args: AccountArgs, runtime: Runtime) => Promise<void>;
declare type AccountShortName = string;
declare type AccountId = string;
declare type UserPropName = string;
declare type SerializedReturnedAccounts = Map<UserPropName, AccountShortName>;
export interface Config {
    homeDir: string;
    port: number;
    init: boolean;
    rm: boolean;
    refDir: string | null;
    network: 'sandbox' | 'testnet';
    masterAccount?: string;
    rpcAddr: string;
    helperUrl?: string;
    explorerUrl?: string;
    initialBalance?: string;
    walletUrl?: string;
    initFn?: CreateRunnerFn;
}
export declare abstract class Runtime {
    near: nearAPI.Near;
    config: Config;
    accountsCreated: Map<AccountId, AccountShortName>;
    resultArgs?: SerializedReturnedAccounts;
    protected root: Account;
    protected masterKey: KeyPair;
    protected keyStore: nearAPI.keyStores.KeyStore;
    protected createdAccounts: ReturnedAccounts;
    constructor(config: Config, accounts?: ReturnedAccounts);
    static create(config: Partial<Config>, fn?: CreateRunnerFn): Promise<Runtime>;
    get accounts(): AccountArgs;
    get homeDir(): string;
    get init(): boolean;
    get rpcAddr(): string;
    get network(): string;
    get masterAccount(): string;
    getMasterKey(): Promise<KeyPair>;
    connect(): Promise<void>;
    run(fn: RunnerFn, args?: SerializedReturnedAccounts): Promise<void>;
    createRun(fn: CreateRunnerFn): Promise<ReturnedAccounts>;
    getRoot(): Account;
    isSandbox(): boolean;
    isTestnet(): boolean;
    executeTransaction(fn: () => Promise<FinalExecutionOutcome>): Promise<FinalExecutionOutcome>;
    addAccountCreated(accountId: string, sender: Account): void;
    protected addMasterAccountKey(): Promise<void>;
    abstract beforeConnect(): Promise<void>;
    abstract afterConnect(): Promise<void>;
    abstract afterRun(): Promise<void>;
    abstract get baseAccountId(): string;
    abstract createFrom(): Promise<Runtime>;
    abstract getKeyStore(): Promise<nearAPI.keyStores.KeyStore>;
    abstract get keyFilePath(): string;
}
export declare class TestnetRuntime extends Runtime {
    static create(config: Partial<Config>, fn?: CreateRunnerFn): Promise<TestnetRuntime>;
    static get defaultConfig(): Config;
    static get provider(): nearAPI.providers.JsonRpcProvider;
    /**
     * Get most recent Wasm Binary of given account.
     * */
    static viewCode(account_id: string): Promise<Buffer>;
    createFrom(): Promise<TestnetRuntime>;
    get baseAccountId(): string;
    get keyFilePath(): string;
    getKeyStore(): Promise<nearAPI.keyStores.KeyStore>;
    beforeConnect(): Promise<void>;
    afterConnect(): Promise<void>;
    afterRun(): Promise<void>;
    private ensureKeyFileFolder;
}
export declare class SandboxRuntime extends Runtime {
    private static readonly LINKDROP_PATH;
    private static get BASE_ACCOUNT_ID();
    private server;
    static defaultConfig(): Promise<Config>;
    static create(config: Partial<Config>, fn?: CreateRunnerFn): Promise<SandboxRuntime>;
    createFrom(): Promise<SandboxRuntime>;
    get baseAccountId(): string;
    get keyFilePath(): string;
    getKeyStore(): Promise<nearAPI.keyStores.KeyStore>;
    get rpcAddr(): string;
    afterConnect(): Promise<void>;
    beforeConnect(): Promise<void>;
    afterRun(): Promise<void>;
}
export {};
