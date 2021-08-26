import { KeyStore } from 'near-api-js/lib/key_stores/keystore';
import { Transaction } from 'near-api-js/lib/transaction';
import { Provider } from 'near-api-js/lib/providers/provider';
import { Account, WalletConnection } from 'near-api-js';
import { CreateTransactionOptions, TransactionCreator } from './TransactionCreator';
export declare type KeyStoreTransactionCreatorOptions = {
    /**
     * The account id that will sign transaction.
     */
    signerId: string;
    /**
     * The network id (e.g. testnet, mainnet) that the transaction is targeting.
     */
    networkId: string;
    /**
     * A KeyStore from `near-api-js` used to retreive a public key.
     */
    keyStore: KeyStore;
    /**
     * An RPC node url used to create a `JsonRpcProvider` if no provider provided.
     */
    nodeUrl?: string;
    /**
     * A NEAR `Provider` instance used to retreive an access key based on the public key
     * retreived from the `KeyStore`.
     */
    provider?: Provider;
};
/**
 * This is an implementation of {@link TransactionCreator}. It is used to create
 * transactions given a `KeyStore` and `Provider` from `near-api-js`.
 *
 * A new `KeyStoreTransactionCreator` can be created from a NEAR `WalletConnection`
 * or by using the constructor.
 *
 * @example
 * ```ts
 * const transactionCreator = KeyStoreTransactionCreator.fromWallet(wallet)
 * ```
 *
 * @example
 * ```ts
 * const transactionCreator = new KeyStoreTransactionCreator({
 *   keyStore,
 *   signerId: "my-acct.testnet",
 *   networkId: "testnet",
 *   nodeUrl: "https://rpc.testnet.near.org",
 * })
 * ```
 */
export declare class KeyStoreTransactionCreator implements TransactionCreator {
    private readonly signerId;
    private readonly networkId;
    private readonly keyStore;
    private readonly provider;
    constructor({ signerId, networkId, keyStore, nodeUrl, provider, }: KeyStoreTransactionCreatorOptions);
    /**
     * @see {@link TransactionCreator.create}
     */
    create({ receiverId, actions, nonceOffset, }: CreateTransactionOptions): Promise<Transaction>;
    /**
     * Create an instance of `KeyStoreTransactionCreator` from a NEAR `Account`.
     */
    static fromAccount(account: Account): KeyStoreTransactionCreator;
    /**
     * Create an instance of `KeyStoreTransactionCreator` from a NEAR `WalletConnection`.
     */
    static fromWallet(wallet: WalletConnection): KeyStoreTransactionCreator;
}
