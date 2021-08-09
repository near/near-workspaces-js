import BN from "bn.js";
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
    rootAccountName?: string;
    rpcAddr: string;
    helperUrl?: string;
    initialBalance?: string;
    walletUrl?: string;
    initFn?: RunnerFn;
}
export declare abstract class Runtime {
    static create(config: Partial<Config>): Promise<Runtime>;
    abstract get defaultConfig(): Config;
    abstract setup(): Promise<void>;
    abstract tearDown(): Promise<void>;
    protected root: Account;
    protected near: nearAPI.Near;
    protected masterKey: nearAPI.KeyPair;
    config: Config;
    constructor(config: Partial<Config>);
    get homeDir(): string;
    get init(): boolean;
    get rpcAddr(): string;
    get network(): string;
    get masterAccount(): string;
    private getConfig;
    private getKeyFromFile;
    getKeyStore(): Promise<nearAPI.keyStores.KeyStore>;
    connect(): Promise<void>;
    run(fn: RunnerFn): Promise<void>;
    get pubKey(): nearAPI.utils.key_pair.PublicKey;
    createAccount(name: string, keyPair?: nearAPI.utils.key_pair.KeyPair): Promise<Account>;
    createAndDeploy(name: string, wasm: string, initialDeposit?: BN): Promise<ContractAccount>;
    getRoot(): Account;
    getAccount(name: string): Account;
    getContractAccount(name: string): ContractAccount;
    isSandbox(): boolean;
    isTestnet(): boolean;
    protected randomAccountId(keyPair?: nearAPI.KeyPair): string;
    protected addKey(name: string, keyPair?: nearAPI.KeyPair): Promise<nearAPI.utils.PublicKey>;
}
export declare class TestnetRuntime extends Runtime {
    get defaultConfig(): Config;
    setup(): Promise<void>;
    tearDown(): Promise<void>;
    createAccount(name: string, keyPair?: nearAPI.KeyPair): Promise<Account>;
    createAndDeploy(name: string, wasm: string, initialDeposit?: BN): Promise<ContractAccount>;
}
