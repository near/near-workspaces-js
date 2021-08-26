const {createAccount} = require('near-api-js/lib/transaction');
const {
  createTestTransactionCreator,
  createTestTranasctionSigner,
  MockProvider,
} = require('../../test-helpers/helpers');
const {ProviderTransactionSender} = require('../ProviderTransactionSender');

describe('ProviderTransactionSender', () => {
  const transactionCreator = createTestTransactionCreator();
  const transactionSigner = createTestTranasctionSigner();

  let provider;
  let sender;
  beforeEach(() => {
    provider = new MockProvider();
    provider.sendTransaction = jest.fn();

    sender = new ProviderTransactionSender({
      provider,
    });
  });

  it('sends a transaction using a provider', async () => {
    const provider = new MockProvider();
    provider.sendTransaction = jest.fn();

    const sender = new ProviderTransactionSender({
      provider,
    });

    const transaction = await transactionCreator.create({
      receiverId: 'test.testnet',
      actions: [createAccount()],
    });
    const signedTransaction = await transactionSigner.sign({transaction});

    await sender.send(signedTransaction);

    expect(provider.sendTransaction).toHaveBeenCalledWith(signedTransaction);
  });

  it('creates, signs, and sends a transaction using a provider', async () => {
    await sender.createSignAndSend({
      transactionCreator,
      transactionSigner,
      transactionOptions: {
        receiverId: 'test.testnet',
        actions: [createAccount()],
      },
    });

    expect(provider.sendTransaction).toHaveBeenCalledTimes(1);
  });

  it('creates, signs, and sends a bundle of transactions using a provider', async () => {
    await sender.bundleCreateSignAndSend({
      transactionCreator,
      transactionSigner,
      bundleTransactionOptions: [
        {
          receiverId: 'test.testnet',
          actions: [createAccount()],
        },
        {
          receiverId: 'test.testnet',
          actions: [createAccount()],
        },
        {
          receiverId: 'test.testnet',
          actions: [createAccount()],
        },
      ],
    });

    expect(provider.sendTransaction).toHaveBeenCalledTimes(3);

    expect(provider.sendTransaction).toHaveBeenNthCalledWith(1, {
      signature: expect.anything(),
      transaction: expect.objectContaining({nonce: 346}),
    });
    expect(provider.sendTransaction).toHaveBeenNthCalledWith(2, {
      signature: expect.anything(),
      transaction: expect.objectContaining({nonce: 347}),
    });
    expect(provider.sendTransaction).toHaveBeenNthCalledWith(3, {
      signature: expect.anything(),
      transaction: expect.objectContaining({nonce: 348}),
    });
  });
});
