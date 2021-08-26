import {Account, WalletConnection} from 'near-api-js';
import {KeyStore} from 'near-api-js/lib/key_stores/keystore';
import {InMemorySigner, Signer} from 'near-api-js/lib/signer';
import {
  SignedTransaction,
  signTransaction,
} from 'near-api-js/lib/transaction';
import {SignTransactionOptions, TransactionSigner} from './TransactionSigner';

export type KeyStoreTransactionSignerOptions = {
  /**
   * NEAR account id used to sign transactions.
   */
  signerId: string;

  /**
   * NEAR network id the transactions are targeting.
   */
  networkId: string;

  /**
   * A `KeyStore` from `near-api-js` used to get a `KeyPair` for signing transactions.
   */
  keyStore: KeyStore;
};

/**
 * This is an implementation of {@link TransactionSigner}. It is used to sign
 * transactions given a `KeyStore` from `near-api-js`.
 *
 * A new `KeyStoreTransactionSigner` can be created from a NEAR `WalletConnection`
 * or by using the constructor.
 *
 * @example
 * ```ts
 * const transactionSigner = KeyStoreTransactionSigner.fromWallet(wallet)
 * ```
 *
 * @example
 * ```ts
 * const transactionSigner = new KeyStoreTransactionSigner({
 *   keyStore,
 *   signerId: "my-acct.testnet",
 *   networkId: "testnet",
 * })
 * ```
 */
export class KeyStoreTransactionSigner implements TransactionSigner {
  private readonly signerId: string;
  private readonly networkId: string;
  private readonly signer: Signer;

  constructor({
    signerId,
    networkId,
    keyStore,
  }: KeyStoreTransactionSignerOptions) {
    this.signerId = signerId;
    this.networkId = networkId;
    this.signer = new InMemorySigner(keyStore);
  }

  /**
   * @see {@link TransactionSigner.sign}
   */
  async sign({
    transaction,
  }: SignTransactionOptions): Promise<SignedTransaction> {
    const [, signedTransaction] = await signTransaction(
      transaction,
      this.signer,
      this.signerId,
      this.networkId,
    );
    return signedTransaction;
  }

  /**
   * Create an instance of `KeyStoreTransactionSigner` from a NEAR `Account`.
   */
  static fromAccount(account: Account): KeyStoreTransactionSigner {
    if (account.connection.signer.constructor.name !== 'InMemorySigner') {
      throw new Error(
        'Account doesn\'t use an InMemorySigner. No key store can be found.',
      );
    }

    const {keyStore} = account.connection.signer as unknown as InMemorySigner;
    return new KeyStoreTransactionSigner({
      keyStore,
      signerId: account.accountId,
      networkId: account.connection.networkId,
    });
  }

  /**
   * Create an instance of `KeyStoreTransactionSigner` from a NEAR `WalletConnection`.
   */
  static fromWallet(wallet: WalletConnection): KeyStoreTransactionSigner {
    return new KeyStoreTransactionSigner({
      signerId: wallet.getAccountId(),
      networkId: wallet._near.connection.networkId,
      keyStore: wallet._keyStore,
    });
  }
}
