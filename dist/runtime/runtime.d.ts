/// <reference types="node" />
import * as nearAPI from "near-api-js";
import { Account } from './account';
import { KeyPair, PublicKey } from '../types';
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
    abstract get keyFilePath(): string;
    abstract afterRun(): Promise<void>;
    protected root: Account;
    protected near: nearAPI.Near;
    protected masterKey: KeyPair;
    protected keyStore: nearAPI.keyStores.KeyStore;
    config: Config;
    protected accountsCreated: Map<AccountId, AccountShortName>;
    resultArgs?: SerializedReturnedAccounts;
    constructor(config: Config, resultArgs?: SerializedReturnedAccounts);
    serializeAccountArgs(args: ReturnedAccounts): void;
    deserializeAccountArgs(args?: SerializedReturnedAccounts): AccountArgs;
    get homeDir(): string;
    get init(): boolean;
    get rpcAddr(): string;
    get network(): string;
    get masterAccount(): string;
    getMasterKey(): Promise<KeyPair>;
    abstract getKeyStore(): Promise<nearAPI.keyStores.KeyStore>;
    beforeConnect(): Promise<void>;
    abstract afterConnect(): Promise<void>;
    connect(): Promise<void>;
    run(fn: RunnerFn, args?: SerializedReturnedAccounts): Promise<void>;
    createRun(fn: CreateRunnerFn): Promise<ReturnedAccounts>;
    protected addMasterAccountKey(): Promise<void>;
    private makeSubAccount;
    createAccount(name: string, { keyPair, initialBalance, }?: {
        keyPair?: KeyPair;
        initialBalance?: string;
    }): Promise<Account>;
    createAndDeploy(name: string, wasm: string | Buffer): Promise<Account>;
    getRoot(): Account;
    getAccount(name: string, addSubaccountPrefix?: boolean): Account;
    isSandbox(): boolean;
    isTestnet(): boolean;
    protected addKey(accountId: string, keyPair?: KeyPair): Promise<PublicKey>;
}
export declare class TestnetRuntime extends Runtime {
    private accountArgs?;
    static create(config: Partial<Config>, _fn?: CreateRunnerFn): Promise<TestnetRuntime>;
    static get defaultConfig(): Config;
    static get provider(): nearAPI.providers.JsonRpcProvider;
    /**
     * Get most recent Wasm Binary of given account.
     * */
    static viewCode(account_id: string): Promise<Buffer>;
    get keyFilePath(): string;
    getKeyStore(): Promise<nearAPI.keyStores.KeyStore>;
    serializeAccountArgs(args: ReturnedAccounts): void;
    deserializeAccountArgs(args?: SerializedReturnedAccounts): AccountArgs;
    beforeConnect(): Promise<void>;
    afterConnect(): Promise<void>;
    afterRun(): Promise<void>;
    createAccount(name: string, { keyPair, initialBalance }?: {
        keyPair?: KeyPair;
        initialBalance?: string;
    }): Promise<Account>;
    createAndDeploy(name: string, wasm: string): Promise<Account>;
    private ensureKeyFileFolder;
}
export declare class SandboxRuntime extends Runtime {
    private static readonly LINKDROP_PATH;
    private server;
    static defaultConfig(): Promise<Config>;
    static create(config: Partial<Config>, fn?: CreateRunnerFn): Promise<SandboxRuntime>;
    get keyFilePath(): string;
    getKeyStore(): Promise<nearAPI.keyStores.KeyStore>;
    get rpcAddr(): string;
    afterConnect(): Promise<void>;
    beforeConnect(): Promise<void>;
    afterRun(): Promise<void>;
    createRun(fn: CreateRunnerFn): Promise<ReturnedAccounts>;
}
export {};
