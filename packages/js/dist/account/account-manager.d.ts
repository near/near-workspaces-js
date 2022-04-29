import * as nearAPI from 'near-api-js';
import { NEAR } from 'near-units';
import { Config, KeyPair, BN, KeyStore, AccountBalance, NamedAccount, PublicKey, AccountView } from '../types';
import { Transaction } from '../transaction';
import { JsonRpcProvider } from '../jsonrpc';
import { TransactionResult } from '../transaction-result';
import { NearAccount } from './near-account';
import { NearAccountManager } from './near-account-manager';
export declare abstract class AccountManager implements NearAccountManager {
    protected config: Config;
    accountsCreated: Set<string>;
    private _root?;
    constructor(config: Config);
    static create(config: Config): AccountManager;
    accountView(accountId: string): Promise<AccountView>;
    getAccount(accountId: string): NearAccount;
    getParentAccount(accountId: string): NearAccount;
    deleteKey(accountId: string): Promise<void>;
    init(): Promise<AccountManager>;
    get root(): NearAccount;
    get initialBalance(): string;
    get doubleInitialBalance(): BN;
    get provider(): JsonRpcProvider;
    batch(sender: NearAccount | string, receiver: NearAccount | string): Transaction;
    getKey(accountId: string): Promise<KeyPair | null>;
    getPublicKey(accountId: string): Promise<PublicKey | null>;
    /** Sets the provided key to store, otherwise creates a new one */
    setKey(accountId: string, keyPair?: KeyPair): Promise<KeyPair>;
    removeKey(accountId: string): Promise<void>;
    deleteAccount(accountId: string, beneficiaryId: string, keyPair?: KeyPair): Promise<TransactionResult>;
    getRootKey(): Promise<KeyPair>;
    balance(account: string | NearAccount): Promise<AccountBalance>;
    availableBalance(account: string | NearAccount): Promise<NEAR>;
    exists(accountId: string | NearAccount): Promise<boolean>;
    canCoverBalance(account: string | NearAccount, amount: BN): Promise<boolean>;
    executeTransaction(tx: Transaction, keyPair?: KeyPair): Promise<TransactionResult>;
    addAccountCreated(account: string, _sender: string): void;
    cleanup(): Promise<void>;
    get rootAccountId(): string;
    protected set rootAccountId(value: string);
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
    private static numTestAccounts;
    private _testnetRoot?;
    static get defaultKeyStore(): KeyStore;
    get masterAccountId(): string;
    get fullRootAccountId(): string;
    get root(): NearAccount;
    get DEFAULT_INITIAL_BALANCE(): string;
    get defaultKeyStore(): KeyStore;
    get urlAccountCreator(): nearAPI.accountCreator.UrlAccountCreator;
    init(): Promise<AccountManager>;
    createTopLevelAccountWithHelper(accountId: string, keyPair: KeyPair): Promise<void>;
    createAccount(accountId: string, keyPair?: KeyPair): Promise<NearAccount>;
    addFundsFromNetwork(accountId?: string): Promise<void>;
    addFunds(accountId: string, amount: BN): Promise<void>;
    deleteAccounts(accounts: string[], beneficiaryId: string): Promise<void[]>;
    createFrom(config: Config): Promise<AccountManager>;
    cleanup(): Promise<void>;
    needsFunds(accountId: string, amount: BN): Promise<boolean>;
    isRootOrTLAccount(accountId: string): boolean;
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
    transact(keyPair?: KeyPair): Promise<TransactionResult>;
}
//# sourceMappingURL=account-manager.d.ts.map