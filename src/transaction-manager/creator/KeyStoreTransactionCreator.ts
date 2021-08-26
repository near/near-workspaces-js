import bs58 from 'bs58';
import {KeyStore} from 'near-api-js/lib/key_stores/keystore';
import {Transaction} from 'near-api-js/lib/transaction';
import {AccessKeyView, Provider} from 'near-api-js/lib/providers/provider';
import {JsonRpcProvider} from 'near-api-js/lib/providers/json-rpc-provider';
import {Account, InMemorySigner, WalletConnection} from 'near-api-js';
import {
  CreateTransactionOptions,
  TransactionCreator,
} from './TransactionCreator';

export type KeyStoreTransactionCreatorOptions = {
  /**
   * The account id that will sign transaction.
   */
  signerId: string;

  /**
   * The network id (e.g. testnet, mainnet) that the transaction is targeting.
   */
  networkId: string;

  /**
   * A KeyStore from `near-api-js` used to retreive a public key.
   */
  keyStore: KeyStore;

  /**
   * An RPC node url used to create a `JsonRpcProvider` if no provider provided.
   */
  nodeUrl?: string;

  /**
   * A NEAR `Provider` instance used to retreive an access key based on the public key
   * retreived from the `KeyStore`.
   */
  provider?: Provider;
};

/**
 * This is an implementation of {@link TransactionCreator}. It is used to create
 * transactions given a `KeyStore` and `Provider` from `near-api-js`.
 *
 * A new `KeyStoreTransactionCreator` can be created from a NEAR `WalletConnection`
 * or by using the constructor.
 *
 * @example
 * ```ts
 * const transactionCreator = KeyStoreTransactionCreator.fromWallet(wallet)
 * ```
 *
 * @example
 * ```ts
 * const transactionCreator = new KeyStoreTransactionCreator({
 *   keyStore,
 *   signerId: "my-acct.testnet",
 *   networkId: "testnet",
 *   nodeUrl: "https://rpc.testnet.near.org",
 * })
 * ```
 */
export class KeyStoreTransactionCreator implements TransactionCreator {
  private readonly signerId: string;
  private readonly networkId: string;
  private readonly keyStore: KeyStore;
  private readonly provider: Provider;

  constructor({
    signerId,
    networkId,
    keyStore,
    nodeUrl,
    provider,
  }: KeyStoreTransactionCreatorOptions) {
    if (!nodeUrl && !provider) {
      throw new Error(
        'Unable to initialize KeyStoreTransactionCreator. nodeUrl or provider must be provided',
      );
    }

    this.signerId = signerId;
    this.networkId = networkId;
    this.keyStore = keyStore;

    this.provider = provider || new JsonRpcProvider(nodeUrl);
  }

  /**
   * @see {@link TransactionCreator.create}
   */
  async create({
    receiverId,
    actions,
    nonceOffset = 1,
  }: CreateTransactionOptions): Promise<Transaction> {
    const keyPair = await this.keyStore.getKey(this.networkId, this.signerId);
    const publicKey = keyPair.getPublicKey();
    const {nonce, block_hash} = await this.provider.query<AccessKeyView>({
      request_type: 'view_access_key',
      account_id: this.signerId,
      public_key: publicKey.toString(),
      finality: 'optimistic',
    });

    return new Transaction({
      receiverId,
      actions,
      publicKey,
      signerId: this.signerId,
      nonce: nonce + nonceOffset,
      blockHash: bs58.decode(block_hash),
    });
  }

  /**
   * Create an instance of `KeyStoreTransactionCreator` from a NEAR `Account`.
   */
  static fromAccount(account: Account): KeyStoreTransactionCreator {
    if (account.connection.signer.constructor.name !== 'InMemorySigner') {
      throw new Error(
        'Account doesn\'t use an InMemorySigner. No key store can be found.',
      );
    }

    const {keyStore} = account.connection.signer as unknown as InMemorySigner;
    return new KeyStoreTransactionCreator({
      keyStore,
      signerId: account.accountId,
      networkId: account.connection.networkId,
      provider: account.connection.provider,
    });
  }

  /**
   * Create an instance of `KeyStoreTransactionCreator` from a NEAR `WalletConnection`.
   */
  static fromWallet(wallet: WalletConnection): KeyStoreTransactionCreator {
    return new KeyStoreTransactionCreator({
      signerId: wallet.getAccountId(),
      networkId: wallet._near.connection.networkId,
      keyStore: wallet._keyStore,
      nodeUrl: wallet._near.config.nodeUrl,
      provider: wallet._near.connection.provider,
    });
  }
}
