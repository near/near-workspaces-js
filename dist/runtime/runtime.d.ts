import BN from "bn.js";
import * as nearAPI from "near-api-js";
import { Account, ContractAccount } from './account';
export declare type TestRunnerFn = (s: Runtime) => Promise<void>;
export interface Config {
    homeDir: string;
    port: number;
    init: boolean;
    rm: boolean;
    refDir: string | null;
    network: 'sandbox' | 'testnet';
    rootAccountName: string;
    rpcAddr?: string;
}
export declare abstract class Runtime {
    static create(config: Partial<Config>): Promise<Runtime>;
    abstract get defaultConfig(): Config;
    abstract run(fn: TestRunnerFn): Promise<Runtime>;
    protected root?: Account;
    protected near?: nearAPI.Near;
    protected masterKey?: nearAPI.KeyPair;
    config: Config;
    constructor(config: Partial<Config>);
    private getConfig;
    protected connect(rpcAddr: string, homeDir: string, init?: boolean): Promise<void>;
    checkConnected(): void;
    get pubKey(): nearAPI.utils.key_pair.PublicKey;
    createAccount(name: string): Promise<Account>;
    createAndDeploy(name: string, wasm: string, initialDeposit?: BN): Promise<ContractAccount>;
    getRoot(): Account;
    getAccount(name: string): Account;
    getContractAccount(name: string): ContractAccount;
}
export declare class TestnetRuntime extends Runtime {
    get defaultConfig(): Config;
    run(_fn: TestRunnerFn): Promise<Runtime>;
}
