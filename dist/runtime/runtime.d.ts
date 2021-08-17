/// <reference types="node" />
import * as nearAPI from "near-api-js";
import { Account } from './account';
import { KeyPair } from '../types';
import { FinalExecutionOutcome } from "../provider";
interface RuntimeArg {
    runtime: Runtime;
    root: Account;
}
export interface ReturnedAccounts {
    [key: string]: Account;
}
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
    static create(config: Partial<Config>, fn?: CreateRunnerFn): Promise<Runtime>;
    abstract afterRun(): Promise<void>;
    abstract get baseAccountId(): string;
    abstract createFrom(): Promise<Runtime>;
    abstract getKeyStore(): Promise<nearAPI.keyStores.KeyStore>;
    abstract get keyFilePath(): string;
    protected root: Account;
    near: nearAPI.Near;
    protected masterKey: KeyPair;
    protected keyStore: nearAPI.keyStores.KeyStore;
    protected createdAccounts: ReturnedAccounts;
    config: Config;
    accountsCreated: Map<AccountId, AccountShortName>;
    resultArgs?: SerializedReturnedAccounts;
    constructor(config: Config, accounts?: ReturnedAccounts);
    get accounts(): AccountArgs;
    get homeDir(): string;
    get init(): boolean;
    get rpcAddr(): string;
    get network(): string;
    get masterAccount(): string;
    getMasterKey(): Promise<KeyPair>;
    beforeConnect(): Promise<void>;
    abstract afterConnect(): Promise<void>;
    connect(): Promise<void>;
    run(fn: RunnerFn, args?: SerializedReturnedAccounts): Promise<void>;
    createRun(fn: CreateRunnerFn): Promise<ReturnedAccounts>;
    protected addMasterAccountKey(): Promise<void>;
    getRoot(): Account;
    isSandbox(): boolean;
    isTestnet(): boolean;
    executeTransaction(fn: () => Promise<FinalExecutionOutcome>): Promise<FinalExecutionOutcome>;
    addAccountCreated(accountId: string, sender: Account): void;
}
export declare class TestnetRuntime extends Runtime {
    static create(config: Partial<Config>, fn?: CreateRunnerFn): Promise<TestnetRuntime>;
    createFrom(): Promise<TestnetRuntime>;
    static get defaultConfig(): Config;
    static get provider(): nearAPI.providers.JsonRpcProvider;
    /**
     * Get most recent Wasm Binary of given account.
     * */
    static viewCode(account_id: string): Promise<Buffer>;
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
    private static readonly BASE_ACCOUNT_ID;
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
