import {WalletConnection} from 'near-api-js';
import {FinalExecutionOutcome} from 'near-api-js/lib/providers';
import {SignedTransaction} from 'near-api-js/lib/transaction';
import {
  TransactionBundleSendOptions,
  TransactionSender,
  TransactionSendOptions,
} from './TransactionSender';

export type WalletTransactionSenderOptions = {
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
export class WalletTransactionSender implements TransactionSender {
  private readonly wallet: WalletConnection;

  constructor({wallet}: WalletTransactionSenderOptions) {
    this.wallet = wallet;
  }

  /**
   * @see {@link TransactionSender.send}
   */
  async send(
    signedTransaction: SignedTransaction,
  ): Promise<FinalExecutionOutcome> {
    return this.wallet._near.connection.provider.sendTransaction(
      signedTransaction,
    );
  }

  /**
   * @see {@link TransactionSender.createSignAndSend}
   */
  async createSignAndSend({
    transactionOptions,
  }: TransactionSendOptions): Promise<FinalExecutionOutcome> {
    // @ts-expect-error
    return this.wallet.account().signAndSendTransaction({
      receiverId: transactionOptions.receiverId,
      actions: transactionOptions.actions,
    });
  }

  /**
   * @see {@link TransactionSender.bundleCreateSignAndSend}
   */
  async bundleCreateSignAndSend({
    bundleTransactionOptions,
    transactionCreator,
  }: TransactionBundleSendOptions): Promise<FinalExecutionOutcome[]> {
    const transactions = await Promise.all(
      bundleTransactionOptions.map(async (option, i) =>
        transactionCreator.create({...option, nonceOffset: i + 1}),
      ),
    );
    await this.wallet.requestSignTransactions({transactions});

    return [];
  }
}
