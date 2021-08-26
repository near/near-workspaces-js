import { Account, WalletConnection } from 'near-api-js';
import { KeyStore } from 'near-api-js/lib/key_stores/keystore';
import { SignedTransaction } from 'near-api-js/lib/transaction';
import { SignTransactionOptions, TransactionSigner } from './TransactionSigner';
export declare type KeyStoreTransactionSignerOptions = {
    /**
     * NEAR account id used to sign transactions.
     */
    signerId: string;
    /**
     * NEAR network id the transactions are targeting.
     */
    networkId: string;
    /**
     * A `KeyStore` from `near-api-js` used to get a `KeyPair` for signing transactions.
     */
    keyStore: KeyStore;
};
/**
 * This is an implementation of {@link TransactionSigner}. It is used to sign
 * transactions given a `KeyStore` from `near-api-js`.
 *
 * A new `KeyStoreTransactionSigner` can be created from a NEAR `WalletConnection`
 * or by using the constructor.
 *
 * @example
 * ```ts
 * const transactionSigner = KeyStoreTransactionSigner.fromWallet(wallet)
 * ```
 *
 * @example
 * ```ts
 * const transactionSigner = new KeyStoreTransactionSigner({
 *   keyStore,
 *   signerId: "my-acct.testnet",
 *   networkId: "testnet",
 * })
 * ```
 */
export declare class KeyStoreTransactionSigner implements TransactionSigner {
    private readonly signerId;
    private readonly networkId;
    private readonly signer;
    constructor({ signerId, networkId, keyStore, }: KeyStoreTransactionSignerOptions);
    /**
     * @see {@link TransactionSigner.sign}
     */
    sign({ transaction, }: SignTransactionOptions): Promise<SignedTransaction>;
    /**
     * Create an instance of `KeyStoreTransactionSigner` from a NEAR `Account`.
     */
    static fromAccount(account: Account): KeyStoreTransactionSigner;
    /**
     * Create an instance of `KeyStoreTransactionSigner` from a NEAR `WalletConnection`.
     */
    static fromWallet(wallet: WalletConnection): KeyStoreTransactionSigner;
}
