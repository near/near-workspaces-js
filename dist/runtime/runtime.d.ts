import * as nearAPI from "near-api-js";
import { Account } from './account';
interface RuntimeArg {
    runtime: Runtime;
}
export interface ReturnedAccounts {
    [key: string]: Account;
}
export interface AccountArgs extends ReturnedAccounts {
    root: Account;
}
export declare type CreateRunnerFn = (args: RuntimeArg) => Promise<ReturnedAccounts>;
export declare type RunnerFn = (args: AccountArgs, runtime?: Runtime) => Promise<void>;
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
    static create(config: Partial<Config>, f?: CreateRunnerFn): Promise<Runtime>;
    abstract get keyFilePath(): string;
    abstract afterRun(): Promise<void>;
    protected root: Account;
    protected near: nearAPI.Near;
    protected masterKey: nearAPI.KeyPair;
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
    getMasterKey(): Promise<nearAPI.KeyPair>;
    abstract getKeyStore(): Promise<nearAPI.keyStores.KeyStore>;
    beforeConnect(): Promise<void>;
    afterConnect(): Promise<void>;
    connect(): Promise<void>;
    run(fn: RunnerFn, args?: SerializedReturnedAccounts): Promise<void>;
    createRun(fn: CreateRunnerFn): Promise<ReturnedAccounts>;
    protected addMasterAccountKey(): Promise<void>;
    private makeSubAccount;
    createAccount(name: string, keyPair?: nearAPI.utils.key_pair.KeyPair): Promise<Account>;
    createAndDeploy(name: string, wasm: string): Promise<Account>;
    getRoot(): Account;
    getAccount(name: string): Account;
    isSandbox(): boolean;
    isTestnet(): boolean;
    protected addKey(name: string, keyPair?: nearAPI.KeyPair): Promise<nearAPI.utils.PublicKey>;
}
export declare class TestnetRuntime extends Runtime {
    private accountArgs?;
    static createRuntime(config: Partial<Config>, resultArgs?: SerializedReturnedAccounts): TestnetRuntime;
    static get defaultConfig(): Config;
    get keyFilePath(): string;
    getKeyStore(): Promise<nearAPI.keyStores.KeyStore>;
    serializeAccountArgs(args: ReturnedAccounts): void;
    deserializeAccountArgs(args?: SerializedReturnedAccounts): AccountArgs;
    beforeConnect(): Promise<void>;
    afterConnect(): Promise<void>;
    afterRun(): Promise<void>;
    createAccount(name: string, keyPair?: nearAPI.KeyPair): Promise<Account>;
    createAndDeploy(name: string, wasm: string): Promise<Account>;
    private ensureKeyFileFolder;
}
export {};
