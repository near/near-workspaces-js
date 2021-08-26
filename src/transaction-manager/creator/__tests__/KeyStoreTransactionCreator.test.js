const {createAccount} = require('near-api-js/lib/transaction');
const {InMemoryKeyStore} = require('near-api-js/lib/key_stores');
const {KeyPair} = require('near-api-js');
const {KeyStoreTransactionCreator} = require('../KeyStoreTransactionCreator');
const {MockProvider} = require('../../test-helpers/helpers');

describe('KeyStoreTransactionCreator', () => {
  let creator;
  let keyPair;
  beforeEach(() => {
    keyPair = KeyPair.fromRandom('ed25519');

    const keyStore = new InMemoryKeyStore();
    keyStore.setKey('testnet', 'my-acct.testnet', keyPair);

    creator = new KeyStoreTransactionCreator({
      keyStore,
      signerId: 'my-acct.testnet',
      networkId: 'testnet',
      provider: new MockProvider(),
    });
  });

  it('creates a transaction', async () => {
    const transaction = await creator.create({
      receiverId: 'test.testnet',
      actions: [createAccount()],
    });
    expect(transaction).toEqual({
      actions: [createAccount()],
      blockHash: expect.any(Uint8Array),
      nonce: 346,
      publicKey: keyPair.getPublicKey(),
      receiverId: 'test.testnet',
      signerId: 'my-acct.testnet',
    });
  });

  it('creates a transaction with nonceOffset', async () => {
    const transaction = await creator.create({
      receiverId: 'test.testnet',
      actions: [createAccount()],
      nonceOffset: 10,
    });
    expect(transaction).toEqual({
      actions: [createAccount()],
      blockHash: expect.any(Uint8Array),
      nonce: 355,
      publicKey: keyPair.getPublicKey(),
      receiverId: 'test.testnet',
      signerId: 'my-acct.testnet',
    });
  });
});
