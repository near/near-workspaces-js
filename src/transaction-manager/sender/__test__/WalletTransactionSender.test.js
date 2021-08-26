const {createAccount, deleteAccount} = require('near-api-js/lib/transaction');
const {
  createTestTransactionCreator,
  createTestTranasctionSigner,
  MockProvider,
} = require('../../test-helpers/helpers');
const {WalletTransactionSender} = require('../WalletTransactionSender');

const mockAccount = {
  signAndSendTransaction: jest.fn(),
};

const mockWallet = {
  account() {
    return mockAccount;
  },
  requestSignTransactions: jest.fn(),
  _near: {
    connection: {
      provider: {
        sendTransaction: jest.fn(),
      },
    },
  },
};

describe('WalletTransactionSender', () => {
  const transactionCreator = createTestTransactionCreator();
  const transactionSigner = createTestTranasctionSigner();
  const sender = new WalletTransactionSender({
    wallet: mockWallet,
  });

  beforeEach(() => {
    mockAccount.signAndSendTransaction.mockClear();
    mockWallet.requestSignTransactions.mockClear();
  });

  it('sends a transaction using a WalletConnections', async () => {
    const transaction = await transactionCreator.create({
      receiverId: 'test.testnet',
      actions: [createAccount()],
    });
    const signedTransaction = await transactionSigner.sign({transaction});

    await sender.send(signedTransaction);

    expect(
      mockWallet._near.connection.provider.sendTransaction,
    ).toHaveBeenCalledWith(signedTransaction);
  });

  it('creates, signs, and sends a transaction using a WalletConnection', async () => {
    await sender.createSignAndSend({
      transactionCreator,
      transactionSigner,
      transactionOptions: {
        receiverId: 'test.testnet',
        actions: [createAccount()],
      },
    });

    expect(mockAccount.signAndSendTransaction).toHaveBeenCalledTimes(1);
    expect(mockAccount.signAndSendTransaction).toHaveBeenCalledWith({
      receiverId: 'test.testnet',
      actions: [createAccount()],
    });
  });

  it('it creates, signs, and sends many transactions using a WalletConnection', async () => {
    await sender.bundleCreateSignAndSend({
      transactionCreator,
      transactionSigner,
      bundleTransactionOptions: [
        {
          receiverId: 'test1.testnet',
          actions: [createAccount()],
        },
        {
          receiverId: 'test1.testnet',
          actions: [deleteAccount()],
        },
        {
          receiverId: 'test2.testnet',
          actions: [createAccount()],
        },
      ],
    });

    expect(mockWallet.requestSignTransactions).toHaveBeenCalledTimes(1);
    expect(mockWallet.requestSignTransactions).toHaveBeenCalledWith({
      transactions: [
        {
          actions: [createAccount()],
          blockHash: expect.any(Uint8Array),
          nonce: 346,
          publicKey: {
            data: new Uint8Array([
              83,
              121,
              114,
              252,
              60,
              204,
              196,
              46,
              235,
              81,
              31,
              114,
              7,
              94,
              190,
              34,
              90,
              137,
              231,
              141,
              215,
              47,
              108,
              143,
              47,
              219,
              12,
              65,
              43,
              29,
              57,
              251,
            ]),
            keyType: 0,
          },
          receiverId: 'test1.testnet',
          signerId: 'my-acct.testnet',
        },
        {
          actions: [deleteAccount()],
          blockHash: expect.any(Uint8Array),
          nonce: 347,
          publicKey: {
            data: new Uint8Array([
              83,
              121,
              114,
              252,
              60,
              204,
              196,
              46,
              235,
              81,
              31,
              114,
              7,
              94,
              190,
              34,
              90,
              137,
              231,
              141,
              215,
              47,
              108,
              143,
              47,
              219,
              12,
              65,
              43,
              29,
              57,
              251,
            ]),
            keyType: 0,
          },
          receiverId: 'test1.testnet',
          signerId: 'my-acct.testnet',
        },
        {
          actions: [createAccount()],
          blockHash: expect.any(Uint8Array),
          nonce: 348,
          publicKey: {
            data: new Uint8Array([
              83,
              121,
              114,
              252,
              60,
              204,
              196,
              46,
              235,
              81,
              31,
              114,
              7,
              94,
              190,
              34,
              90,
              137,
              231,
              141,
              215,
              47,
              108,
              143,
              47,
              219,
              12,
              65,
              43,
              29,
              57,
              251,
            ]),
            keyType: 0,
          },
          receiverId: 'test2.testnet',
          signerId: 'my-acct.testnet',
        },
      ],
    });
  });
});
