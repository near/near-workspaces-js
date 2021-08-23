import * as nearAPI from 'near-api-js';
import { PublicKey, KeyPair, FinalExecutionOutcome, KeyStore } from '../types';
import { AccountBalance, NamedAccount } from '../runtime/types';
import { Transaction } from '../runtime/transaction';
import { JSONRpc } from '../provider';
import { NEAR } from '../interfaces';
import { NearAccount } from './near-account';
import { NearAccountManager } from './near-account-manager';
declare type AccountShortName = string;
declare type AccountId = string;
export interface Network {
    id: string;
    rpcAddr: string;
    helperUrl?: string;
}
export declare abstract class AccountManager implements NearAccountManager {
    protected near: NEAR;
    accountsCreated: Map<AccountId, AccountShortName>;
    constructor(near: NEAR);
    static create(near: NEAR): Promise<AccountManager>;
    getAccount(accountId: string): NearAccount;
    deleteKey(account_id: string): Promise<void>;
    init(): Promise<AccountManager>;
    get root(): NearAccount;
    get initialBalance(): string;
    get provider(): JSONRpc;
    createTransaction(sender: NearAccount | string, receiver: NearAccount | string): Transaction;
    getKey(accountId: string): Promise<KeyPair | null>;
    /** Sets the provider key to store, otherwise creates a new one */
    setKey(accountId: string, keyPair?: KeyPair): Promise<KeyPair>;
    removeKey(accountId: string): Promise<void>;
    deleteAccount(accountId: string, beneficiaryId: string): Promise<void>;
    getRootKey(): Promise<KeyPair>;
    balance(account: string | NearAccount): Promise<AccountBalance>;
    exists(accountId: string | NearAccount): Promise<boolean>;
    executeTransaction(tx: Transaction, keyPair?: KeyPair): Promise<FinalExecutionOutcome>;
    addAccountCreated(account: string, sender: string): void;
    cleanup(): Promise<void>;
    get rootAccountId(): string;
    abstract get DEFAULT_INITIAL_BALANCE(): string;
    abstract createFrom(near: NEAR): Promise<NearAccountManager>;
    abstract get defaultKeyStore(): KeyStore;
    protected get keyStore(): KeyStore;
    protected get signer(): nearAPI.InMemorySigner;
    protected get networkId(): string;
    protected get connection(): nearAPI.Connection;
}
export declare class TestnetManager extends AccountManager {
    static readonly KEYSTORE_PATH: string;
    static readonly KEY_DIR_PATH: string;
    static get defaultKeyStore(): KeyStore;
    get DEFAULT_INITIAL_BALANCE(): string;
    get defaultKeyStore(): KeyStore;
    init(): Promise<AccountManager>;
    createAccount(accountId: string, pubKey: PublicKey): Promise<NearAccount>;
    addFunds(): Promise<void>;
    createAndFundAccount(): Promise<void>;
    initRootAccount(): Promise<void>;
    createFrom(near: NEAR): Promise<AccountManager>;
}
export declare class TestnetSubaccountManager extends TestnetManager {
    subAccount: string;
    get rootAccountId(): string;
    get realRoot(): NearAccount;
    init(): Promise<AccountManager>;
    cleanup(): Promise<void>;
    get initialBalance(): string;
}
export declare class SandboxManager extends AccountManager {
    init(): Promise<AccountManager>;
    createFrom(near: NEAR): Promise<NearAccountManager>;
    get DEFAULT_INITIAL_BALANCE(): string;
    get defaultKeyStore(): KeyStore;
    get keyFilePath(): string;
}
export declare class ManagedTransaction extends Transaction {
    private readonly manager;
    private delete;
    constructor(manager: NearAccountManager, sender: NamedAccount | string, receiver: NamedAccount | string);
    createAccount(): this;
    deleteAccount(beneficiaryId: string): this;
    /**
     *
     * @param keyPair Temporary key to sign transaction
     * @returns
     */
    signAndSend(keyPair?: KeyPair): Promise<FinalExecutionOutcome>;
}
export {};
