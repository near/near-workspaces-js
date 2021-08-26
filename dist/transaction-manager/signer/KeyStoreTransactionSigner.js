"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyStoreTransactionSigner = void 0;
const signer_1 = require("near-api-js/lib/signer");
const transaction_1 = require("near-api-js/lib/transaction");
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
class KeyStoreTransactionSigner {
    constructor({ signerId, networkId, keyStore, }) {
        this.signerId = signerId;
        this.networkId = networkId;
        this.signer = new signer_1.InMemorySigner(keyStore);
    }
    /**
     * @see {@link TransactionSigner.sign}
     */
    async sign({ transaction, }) {
        const [, signedTransaction] = await transaction_1.signTransaction(transaction, this.signer, this.signerId, this.networkId);
        return signedTransaction;
    }
    /**
     * Create an instance of `KeyStoreTransactionSigner` from a NEAR `Account`.
     */
    static fromAccount(account) {
        if (account.connection.signer.constructor.name !== 'InMemorySigner') {
            throw new Error('Account doesn\'t use an InMemorySigner. No key store can be found.');
        }
        const { keyStore } = account.connection.signer;
        return new KeyStoreTransactionSigner({
            keyStore,
            signerId: account.accountId,
            networkId: account.connection.networkId,
        });
    }
    /**
     * Create an instance of `KeyStoreTransactionSigner` from a NEAR `WalletConnection`.
     */
    static fromWallet(wallet) {
        return new KeyStoreTransactionSigner({
            signerId: wallet.getAccountId(),
            networkId: wallet._near.connection.networkId,
            keyStore: wallet._keyStore,
        });
    }
}
exports.KeyStoreTransactionSigner = KeyStoreTransactionSigner;
//# sourceMappingURL=KeyStoreTransactionSigner.js.map