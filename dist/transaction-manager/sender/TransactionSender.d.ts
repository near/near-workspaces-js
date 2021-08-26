import { FinalExecutionOutcome } from 'near-api-js/lib/providers/provider';
import { SignedTransaction } from 'near-api-js/lib/transaction';
import { CreateTransactionOptions, TransactionCreator } from '../creator/TransactionCreator';
import { TransactionSigner } from '../signer/TransactionSigner';
export declare type TransactionSendOptions = {
    /**
     * Options for creating a new `Transaction`.
     */
    transactionOptions: CreateTransactionOptions;
    /**
     * The {@link TransactionCreator} to use for creating the transaction to send.
     */
    transactionCreator: TransactionCreator;
    /**
     * The {@link TransactionSigner} to use for signing the transaction to send.
     */
    transactionSigner: TransactionSigner;
};
export declare type TransactionBundleSendOptions = {
    /**
     * An array of options for creating many transactions.
     */
    bundleTransactionOptions: CreateTransactionOptions[];
    /**
     * The {@link TransactionCreator} to use for creating the transaction to send.
     */
    transactionCreator: TransactionCreator;
    /**
     * The {@link TransactionSigner} to use for signing the transaction to send.
     */
    transactionSigner: TransactionSigner;
};
/**
 * An interface used by {@link TransactionManager} to configure how transactions are sent
 * to the NEAR network.
 */
export interface TransactionSender {
    /**
     * Send a signed transaction to the NEAR network.
     */
    send(signedTransaction: SignedTransaction): Promise<FinalExecutionOutcome>;
    /**
     * Creates, signs, and sends a transaction to the NEAR network.
     */
    createSignAndSend(options: TransactionSendOptions): Promise<FinalExecutionOutcome>;
    /**
     * Creates, signs, and seirially sends many transaction to teh NEAR network.
     */
    bundleCreateSignAndSend(options: TransactionBundleSendOptions): Promise<FinalExecutionOutcome[]>;
}
