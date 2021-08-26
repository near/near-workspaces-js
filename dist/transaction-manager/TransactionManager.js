"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionManager = void 0;
const creator_1 = require("./creator");
const signer_1 = require("./signer");
const sender_1 = require("./sender");
/**
 * The `TransactionManager` class is used to create, sign, and send NEAR transactions
 * with a given {@link TransactionCreator}, {@link TransactionSigner}, and {@link TransactionSender}.
 *
 * A new `TransactionManager` can be created from a NEAR `Account`, NEAR `WalletConnection`, or using the constructor.
 *
 * @example
 * ```ts
 * const transactionManager = TransactionManager.fromAccount(account);
 * ```
 *
 * @example
 * ```ts
 * const transactionManager = TransactionManager.fromWallet(wallet);
 * ```
 *
 * @example
 * ```ts
 * const keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);
 * const transactionManager = new TransactionManager({
 *  transactionCreator: new KeyStoreTransactionCreator({
 *    keyStore,
 *    signerId: wallet.getAccountId(),
 *    networkId: "testnet",
 *    nodeUrl: "https://rpc.testnet.near.org",
 *  }),
 *  transactionSigner: new KeyStoreTransactionSigner({
 *    keyStore,
 *    signerId: wallet.getAccountId(),
 *    networkId: "testnet",
 *  }),
 *  transactionSender: new ProviderTransactionSender({
 *    provider: new JsonRpcProvider("https://rpc.testnet.near.org"),
 *  }),
 * });
 * ```
 */
class TransactionManager {
    constructor({ transactionCreator, transactionSigner, transactionSender, }) {
        this.transactionCreator = transactionCreator;
        this.transactionSigner = transactionSigner;
        this.transactionSender = transactionSender;
    }
    /**
     * Creates a new transaction given a receiverId and actions with a {@link TransactionCreator}.
     *
     * @example
     * ```ts
     * const transaction = await transactionManager.createTransaction({
     *   receiverId: "example.testnet",
     *   actions: [functionCall("method", {}, DEFAULT_FUNCTION_CALL_GAS, [])],
     * });
     * ```
     */
    async createTransaction(options) {
        return this.transactionCreator.create(options);
    }
    /**
     * Signs a transaction with a {@link TransactionSigner}.
     *
     * @example
     * ```ts
     * const signedTransaction = await transactionManager.signTransaction(transaction);
     * ```
     */
    async signTransaction(transaction) {
        return this.transactionSigner.sign({ transaction });
    }
    /**
     * Creates a new transaction with a {@link TransactionCreator} and
     * signs it with a {@link TransactionSigner}.
     *
     * @example
     * ```ts
     * const signedTransaction = await transactionManager.createSignedTransaction({
     *   receiverId: "example.testnet",
     *   actions: [functionCall("method", {}, DEFAULT_FUNCTION_CALL_GAS, [])],
     * });
     * ```
     */
    async createSignedTransaction(options) {
        const transaction = await this.createTransaction(options);
        return this.signTransaction(transaction);
    }
    /**
     * Sign and send a transaction using a {@link TransactionSender}.
     */
    async sendTransaction(transaction) {
        const signedTransaction = await this.signTransaction(transaction);
        return this.sendSignedTransaction(signedTransaction);
    }
    /**
     * Send a signed transaction using a {@link TransactionSender}.
     */
    async sendSignedTransaction(signedTransaction) {
        return this.transactionSender.send(signedTransaction);
    }
    /**
     * Creates, signs, and sends a transaction with a {@link TransactionSender}.
     *
     * @example
     * ```ts
     * const outcome = await transactionManager.createSignAndSendTransaction({
     *   receiverId: "example.testnet",
     *   actions: [functionCall("method", {}, DEFAULT_FUNCTION_CALL_GAS, [])],
     * });
     * ```
     */
    async createSignAndSendTransaction(options) {
        return this.transactionSender.createSignAndSend({
            transactionOptions: options,
            transactionCreator: this.transactionCreator,
            transactionSigner: this.transactionSigner,
        });
    }
    /**
     * Creates, signs, and sends many transactions using a {@link TransactionSender}.
     *
     * @example
     * ```ts
     * const outcomes = await transactionManager.bundleCreateSignAndSendTransactions([
     *   {
     *     receiverId: "example.testnet",
     *     actions: [functionCall("method1", {}, DEFAULT_FUNCTION_CALL_GAS, [])],
     *   },
     *   {
     *     receiverId: "example.testnet",
     *     actions: [functionCall("method2", {}, DEFAULT_FUNCTION_CALL_GAS, [])],
     *   },
     *   {
     *     receiverId: "example.testnet",
     *     actions: [functionCall("method3", {}, DEFAULT_FUNCTION_CALL_GAS, [])],
     *   },
     *   {
     *     receiverId: "example.testnet",
     *     actions: [functionCall("method4", {}, DEFAULT_FUNCTION_CALL_GAS, [])],
     *   },
     * ]);
     * ```
     */
    async bundleCreateSignAndSendTransactions(options) {
        return this.transactionSender.bundleCreateSignAndSend({
            bundleTransactionOptions: options,
            transactionCreator: this.transactionCreator,
            transactionSigner: this.transactionSigner,
        });
    }
    /**
     * Creates a new instance of `TransactionManager` with a NEAR `Account`.
     */
    static fromAccount(account) {
        return new TransactionManager({
            transactionCreator: creator_1.KeyStoreTransactionCreator.fromAccount(account),
            transactionSigner: signer_1.KeyStoreTransactionSigner.fromAccount(account),
            transactionSender: new sender_1.ProviderTransactionSender({
                provider: account.connection.provider,
            }),
        });
    }
    /**
     * Creates a new instance of `TransactionManager` with a NEAR `WalletConnection`.
     */
    static fromWallet(wallet) {
        return new TransactionManager({
            transactionCreator: creator_1.KeyStoreTransactionCreator.fromWallet(wallet),
            transactionSigner: signer_1.KeyStoreTransactionSigner.fromWallet(wallet),
            transactionSender: new sender_1.WalletTransactionSender({ wallet }),
        });
    }
}
exports.TransactionManager = TransactionManager;
//# sourceMappingURL=TransactionManager.js.map