import {
  FinalExecutionOutcome,
  Provider,
} from 'near-api-js/lib/providers/provider';
import {SignedTransaction} from 'near-api-js/lib/transaction';
import {
  TransactionBundleSendOptions,
  TransactionSender,
  TransactionSendOptions,
} from './TransactionSender';

export type ProviderTransactionSenderOptions = {
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
export class ProviderTransactionSender implements TransactionSender {
  private readonly provider: Provider;

  constructor({provider}: ProviderTransactionSenderOptions) {
    this.provider = provider;
  }

  /**
   * @see {@link TransactionSender.send}
   */
  async send(signedTransaction: SignedTransaction): Promise<FinalExecutionOutcome> {
    return this.provider.sendTransaction(signedTransaction);
  }

  /**
   * @see {@link TransactionSender.createSignAndSend}
   */
  async createSignAndSend({
    transactionOptions,
    transactionCreator,
    transactionSigner,
  }: TransactionSendOptions): Promise<FinalExecutionOutcome> {
    const transaction = await transactionCreator.create(transactionOptions);
    const signedTransaction = await transactionSigner.sign({transaction});
    return this.provider.sendTransaction(signedTransaction);
  }

  /**
   * @see {@link TransactionSender.bundleCreateSignAndSend}
   */
  async bundleCreateSignAndSend({
    bundleTransactionOptions,
    transactionCreator,
    transactionSigner,
  }: TransactionBundleSendOptions): Promise<FinalExecutionOutcome[]> {
    const outcomes: FinalExecutionOutcome[] = [];

    for (const [i, transactionOptions] of bundleTransactionOptions.entries()) {
      outcomes.push(
        await this.createSignAndSend({
          transactionOptions: {...transactionOptions, nonceOffset: i + 1},
          transactionCreator,
          transactionSigner,
        }),
      );
    }

    return outcomes;
  }
}
