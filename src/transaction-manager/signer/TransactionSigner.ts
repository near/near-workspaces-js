import {SignedTransaction, Transaction} from 'near-api-js/lib/transaction';

export type SignTransactionOptions = {
  /**
   * A transaction to sign.
   */
  transaction: Transaction;
};

/**
 * An interface used by {@link TransactionManager} to configure how transactions are signed.
 */
export interface TransactionSigner {
  /**
   * Signs a given transaction.
   */
  sign(options: SignTransactionOptions): Promise<SignedTransaction>;
}
