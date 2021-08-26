const {createAccount} = require('near-api-js/lib/transaction');
const {
  createTestKeyStore,
  createTestTransactionCreator,
} = require('../../test-helpers/helpers');
const {KeyStoreTransactionSigner} = require('../KeyStoreTransactionSigner');

describe('KeyStoreTransactionSigner', () => {
  it('signs a transaction useing a KeyStore', async () => {
    const creator = createTestTransactionCreator();

    const signer = new KeyStoreTransactionSigner({
      keyStore: createTestKeyStore(),
      signerId: 'my-acct.testnet',
      networkId: 'testnet',
    });

    const transaction = await creator.create({
      receiverId: 'test.testnet',
      actions: [createAccount()],
    });

    const signedTransaction = await signer.sign({transaction});

    expect(signedTransaction).toEqual({
      transaction,
      signature: {
        data: new Uint8Array([
          219,
          66,
          42,
          235,
          3,
          9,
          207,
          98,
          19,
          87,
          207,
          54,
          19,
          92,
          47,
          218,
          235,
          110,
          121,
          223,
          176,
          162,
          149,
          137,
          111,
          202,
          156,
          182,
          8,
          178,
          126,
          75,
          61,
          223,
          192,
          25,
          213,
          71,
          7,
          128,
          20,
          103,
          241,
          24,
          133,
          192,
          195,
          114,
          203,
          229,
          224,
          203,
          72,
          72,
          74,
          90,
          248,
          38,
          235,
          197,
          199,
          65,
          59,
          8,
        ]),
        keyType: 0,
      },
    });
  });
});
