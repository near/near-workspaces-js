import {Action, Transaction} from 'near-api-js/lib/transaction';

export type CreateTransactionOptions = {
  /**
   * The account id receiving the transaction.
   */
  receiverId: string;

  /**
   * An array of actions to include in the transaction.
   */
  actions: Action[];

  /**
   * How much to increment the previous access key nonce by.
   * This is useful when creating multiple transactions at once.
   */
  nonceOffset?: number;
};

/**
 * An interface used by {@link TransactionManager} to configure how transactions are cerated.
 */
export interface TransactionCreator {
  /**
   * Creates a transaction given a receiverId, actions, and a nonceOffset.
   */
  create(option: CreateTransactionOptions): Promise<Transaction>;
}
