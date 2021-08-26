import { Account, WalletConnection } from 'near-api-js';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers/provider';
import { SignedTransaction, Transaction } from 'near-api-js/lib/transaction';
import { TransactionCreator, CreateTransactionOptions } from './creator';
import { TransactionSigner } from './signer';
import { TransactionSender } from './sender';
export declare type TransactionManagerOptions = {
    transactionCreator: TransactionCreator;
    transactionSigner: TransactionSigner;
    transactionSender: TransactionSender;
};
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
export declare class TransactionManager {
    private readonly transactionCreator;
    private readonly transactionSigner;
    private readonly transactionSender;
    constructor({ transactionCreator, transactionSigner, transactionSender, }: TransactionManagerOptions);
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
    createTransaction(options: CreateTransactionOptions): Promise<Transaction>;
    /**
     * Signs a transaction with a {@link TransactionSigner}.
     *
     * @example
     * ```ts
     * const signedTransaction = await transactionManager.signTransaction(transaction);
     * ```
     */
    signTransaction(transaction: Transaction): Promise<SignedTransaction>;
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
    createSignedTransaction(options: CreateTransactionOptions): Promise<SignedTransaction>;
    /**
     * Sign and send a transaction using a {@link TransactionSender}.
     */
    sendTransaction(transaction: Transaction): Promise<FinalExecutionOutcome>;
    /**
     * Send a signed transaction using a {@link TransactionSender}.
     */
    sendSignedTransaction(signedTransaction: SignedTransaction): Promise<FinalExecutionOutcome>;
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
    createSignAndSendTransaction(options: CreateTransactionOptions): Promise<FinalExecutionOutcome>;
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
    bundleCreateSignAndSendTransactions(options: CreateTransactionOptions[]): Promise<FinalExecutionOutcome[]>;
    /**
     * Creates a new instance of `TransactionManager` with a NEAR `Account`.
     */
    static fromAccount(account: Account): TransactionManager;
    /**
     * Creates a new instance of `TransactionManager` with a NEAR `WalletConnection`.
     */
    static fromWallet(wallet: WalletConnection): TransactionManager;
}
