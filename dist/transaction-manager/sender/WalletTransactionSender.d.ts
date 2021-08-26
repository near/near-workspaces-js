import { WalletConnection } from 'near-api-js';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers';
import { SignedTransaction } from 'near-api-js/lib/transaction';
import { TransactionBundleSendOptions, TransactionSender, TransactionSendOptions } from './TransactionSender';
export declare type WalletTransactionSenderOptions = {
    /**
     * A NEAR `WalletConnection` from 'near-api-js`.
     */
    wallet: WalletConnection;
};
/**
 * This is an implementation of {@link TransactionSender}. It is used to send
 * transactions by sending the to the NEAR wallet via redirect.
 *
 *
 * @example
 * ```ts
 * const transactionSender = new WalletTransactionSender({ wallet })
 * ```
 */
export declare class WalletTransactionSender implements TransactionSender {
    private readonly wallet;
    constructor({ wallet }: WalletTransactionSenderOptions);
    /**
     * @see {@link TransactionSender.send}
     */
    send(signedTransaction: SignedTransaction): Promise<FinalExecutionOutcome>;
    /**
     * @see {@link TransactionSender.createSignAndSend}
     */
    createSignAndSend({ transactionOptions, }: TransactionSendOptions): Promise<FinalExecutionOutcome>;
    /**
     * @see {@link TransactionSender.bundleCreateSignAndSend}
     */
    bundleCreateSignAndSend({ bundleTransactionOptions, transactionCreator, }: TransactionBundleSendOptions): Promise<FinalExecutionOutcome[]>;
}
