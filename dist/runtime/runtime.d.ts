import * as nearAPI from "near-api-js";
import { Account, ContractAccount } from './account';
export declare type RunnerFn = (s: Runtime) => Promise<void>;
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
    initFn?: RunnerFn;
}
export declare abstract class Runtime {
    static create(config: Partial<Config>, f?: RunnerFn): Promise<Runtime>;
    abstract get defaultConfig(): Config;
    abstract get keyFilePath(): string;
    abstract afterRun(): Promise<void>;
    protected root: Account;
    protected near: nearAPI.Near;
    protected masterKey: nearAPI.KeyPair;
    protected keyStore: nearAPI.keyStores.KeyStore;
    config: Config;
    constructor(config: Partial<Config>);
    get homeDir(): string;
    get init(): boolean;
    get rpcAddr(): string;
    get network(): string;
    get masterAccount(): string;
    getMasterKey(): Promise<nearAPI.KeyPair>;
    private getConfig;
    abstract getKeyStore(): Promise<nearAPI.keyStores.KeyStore>;
    beforeConnect(): Promise<void>;
    afterConnect(): Promise<void>;
    connect(): Promise<void>;
    run(fn: RunnerFn): Promise<void>;
    protected addMasterAccountKey(): Promise<void>;
    createAccount(name: string, keyPair?: nearAPI.utils.key_pair.KeyPair): Promise<Account>;
    createAndDeploy(name: string, wasm: string): Promise<ContractAccount>;
    getRoot(): Account;
    getAccount(name: string): Account;
    getContractAccount(name: string): ContractAccount;
    isSandbox(): boolean;
    isTestnet(): boolean;
    protected addKey(name: string, keyPair?: nearAPI.KeyPair): Promise<nearAPI.utils.PublicKey>;
}
export declare class TestnetRuntime extends Runtime {
    get defaultConfig(): Config;
    get keyFilePath(): string;
    getKeyStore(): Promise<nearAPI.keyStores.KeyStore>;
    beforeConnect(): Promise<void>;
    afterConnect(): Promise<void>;
    afterRun(): Promise<void>;
    createAccount(name: string, keyPair?: nearAPI.KeyPair): Promise<Account>;
    createAndDeploy(name: string, wasm: string): Promise<ContractAccount>;
    getAccount(name: string): Account;
    getContractAccount(name: string): ContractAccount;
    private makeSubAccount;
    private ensureKeyFileFolder;
}
