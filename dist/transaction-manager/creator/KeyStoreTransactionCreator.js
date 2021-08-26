"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyStoreTransactionCreator = void 0;
const bs58_1 = __importDefault(require("bs58"));
const transaction_1 = require("near-api-js/lib/transaction");
const json_rpc_provider_1 = require("near-api-js/lib/providers/json-rpc-provider");
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
class KeyStoreTransactionCreator {
    constructor({ signerId, networkId, keyStore, nodeUrl, provider, }) {
        if (!nodeUrl && !provider) {
            throw new Error('Unable to initialize KeyStoreTransactionCreator. nodeUrl or provider must be provided');
        }
        this.signerId = signerId;
        this.networkId = networkId;
        this.keyStore = keyStore;
        this.provider = provider || new json_rpc_provider_1.JsonRpcProvider(nodeUrl);
    }
    /**
     * @see {@link TransactionCreator.create}
     */
    async create({ receiverId, actions, nonceOffset = 1, }) {
        const keyPair = await this.keyStore.getKey(this.networkId, this.signerId);
        const publicKey = keyPair.getPublicKey();
        const { nonce, block_hash } = await this.provider.query({
            request_type: 'view_access_key',
            account_id: this.signerId,
            public_key: publicKey.toString(),
            finality: 'optimistic',
        });
        return new transaction_1.Transaction({
            receiverId,
            actions,
            publicKey,
            signerId: this.signerId,
            nonce: nonce + nonceOffset,
            blockHash: bs58_1.default.decode(block_hash),
        });
    }
    /**
     * Create an instance of `KeyStoreTransactionCreator` from a NEAR `Account`.
     */
    static fromAccount(account) {
        if (account.connection.signer.constructor.name !== 'InMemorySigner') {
            throw new Error('Account doesn\'t use an InMemorySigner. No key store can be found.');
        }
        const { keyStore } = account.connection.signer;
        return new KeyStoreTransactionCreator({
            keyStore,
            signerId: account.accountId,
            networkId: account.connection.networkId,
            provider: account.connection.provider,
        });
    }
    /**
     * Create an instance of `KeyStoreTransactionCreator` from a NEAR `WalletConnection`.
     */
    static fromWallet(wallet) {
        return new KeyStoreTransactionCreator({
            signerId: wallet.getAccountId(),
            networkId: wallet._near.connection.networkId,
            keyStore: wallet._keyStore,
            nodeUrl: wallet._near.config.nodeUrl,
            provider: wallet._near.connection.provider,
        });
    }
}
exports.KeyStoreTransactionCreator = KeyStoreTransactionCreator;
//# sourceMappingURL=KeyStoreTransactionCreator.js.map