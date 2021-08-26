import { FinalExecutionOutcome, Provider } from 'near-api-js/lib/providers/provider';
import { SignedTransaction } from 'near-api-js/lib/transaction';
import { TransactionBundleSendOptions, TransactionSender, TransactionSendOptions } from './TransactionSender';
export declare type ProviderTransactionSenderOptions = {
    /**
     * A NEAR Provider from `near-api-js`. For example, `JsonRpcProvider`.
     */
    provider: Provider;
};
/**
 * This is an implementation of {@link TransactionSender}. It is used to send
 * transactions with a `Provider` from `near-api-js`.
 *
 *
 * @example
 * ```ts
 * const transactionSender = new ProviderTransactionSender({ provider: near.connection.provider })
 * ```
 */
export declare class ProviderTransactionSender implements TransactionSender {
    private readonly provider;
    constructor({ provider }: ProviderTransactionSenderOptions);
    /**
     * @see {@link TransactionSender.send}
     */
    send(signedTransaction: SignedTransaction): Promise<FinalExecutionOutcome>;
    /**
     * @see {@link TransactionSender.createSignAndSend}
     */
    createSignAndSend({ transactionOptions, transactionCreator, transactionSigner, }: TransactionSendOptions): Promise<FinalExecutionOutcome>;
    /**
     * @see {@link TransactionSender.bundleCreateSignAndSend}
     */
    bundleCreateSignAndSend({ bundleTransactionOptions, transactionCreator, transactionSigner, }: TransactionBundleSendOptions): Promise<FinalExecutionOutcome[]>;
}
