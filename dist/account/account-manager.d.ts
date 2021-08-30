import * as nearAPI from 'near-api-js';
import { KeyPair, KeyStore, AccountBalance, NamedAccount } from '../types';
import { Transaction } from '../transaction';
import { JSONRpc } from '../jsonrpc';
import { Config } from '../interfaces';
import { TransactionResult } from '../transaction-result';
import { NearAccount } from './near-account';
import { NearAccountManager } from './near-account-manager';
export declare abstract class AccountManager implements NearAccountManager {
    protected config: Config;
    accountsCreated: Set<string>;
    private _root?;
    constructor(config: Config);
    static create(config: Config): AccountManager;
    getAccount(accountId: string): NearAccount;
    getParentAccount(accountId: string): NearAccount;
    deleteKey(account_id: string): Promise<void>;
    init(): Promise<AccountManager>;
    get root(): NearAccount;
    get initialBalance(): string;
    get provider(): JSONRpc;
    createTransaction(sender: NearAccount | string, receiver: NearAccount | string): Transaction;
    getKey(accountId: string): Promise<KeyPair | null>;
    /** Sets the provided key to store, otherwise creates a new one */
    setKey(accountId: string, keyPair?: KeyPair): Promise<KeyPair>;
    removeKey(accountId: string): Promise<void>;
    deleteAccount(accountId: string, beneficiaryId: string): Promise<void>;
    getRootKey(): Promise<KeyPair>;
    balance(account: string | NearAccount): Promise<AccountBalance>;
    exists(accountId: string | NearAccount): Promise<boolean>;
    executeTransaction(tx: Transaction, keyPair?: KeyPair): Promise<TransactionResult>;
    addAccountCreated(account: string, _sender: string): void;
    cleanup(): Promise<void>;
    get rootAccountId(): string;
    abstract get DEFAULT_INITIAL_BALANCE(): string;
    abstract createFrom(config: Config): Promise<NearAccountManager>;
    abstract get defaultKeyStore(): KeyStore;
    protected get keyStore(): KeyStore;
    protected get signer(): nearAPI.InMemorySigner;
    protected get networkId(): string;
    protected get connection(): nearAPI.Connection;
}
export declare class TestnetManager extends AccountManager {
    static readonly KEYSTORE_PATH: string;
    static readonly KEY_DIR_PATH: string;
    private static numRootAccounts;
    private static numTestAccounts;
    static get defaultKeyStore(): KeyStore;
    get DEFAULT_INITIAL_BALANCE(): string;
    get defaultKeyStore(): KeyStore;
    init(): Promise<AccountManager>;
    createAccount(accountId: string, keyPair: KeyPair): Promise<NearAccount>;
    addFunds(): Promise<void>;
    createAndFundAccount(): Promise<void>;
    initRootAccount(): Promise<void>;
    createFrom(config: Config): Promise<AccountManager>;
    cleanup(): Promise<void>;
}
export declare class SandboxManager extends AccountManager {
    init(): Promise<AccountManager>;
    createFrom(config: Config): Promise<NearAccountManager>;
    get DEFAULT_INITIAL_BALANCE(): string;
    get defaultKeyStore(): KeyStore;
    get keyFilePath(): string;
}
export declare class ManagedTransaction extends Transaction {
    private readonly manager;
    private delete;
    constructor(manager: AccountManager, sender: NamedAccount | string, receiver: NamedAccount | string);
    createAccount(): this;
    deleteAccount(beneficiaryId: string): this;
    /**
     *
     * @param keyPair Temporary key to sign transaction
     * @returns
     */
    signAndSend(keyPair?: KeyPair): Promise<TransactionResult>;
}
