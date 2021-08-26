import {KeyPair} from 'near-api-js';
import {InMemoryKeyStore} from 'near-api-js/lib/key_stores';
import {Provider} from 'near-api-js/lib/providers';
import {
  AccessKeyWithPublicKey,
  BlockChangeResult,
  BlockId,
  BlockReference,
  BlockResult,
  ChangeResult,
  ChunkId,
  ChunkResult,
  EpochValidatorInfo,
  FinalExecutionOutcome,
  GasPrice,
  LightClientProof,
  LightClientProofRequest,
  NearProtocolConfig,
  NodeStatusResult,
} from 'near-api-js/lib/providers/provider';
import {SignedTransaction} from 'near-api-js/lib/transaction';
import {KeyStoreTransactionCreator} from '../creator';
import {KeyStoreTransactionSigner} from '../signer';

export class MockProvider implements Provider {
  async query() {
    return {
      nonce: 345,
      permission: 'FullAccess',
      block_height: 1,
      block_hash: 'CCLc18qkRTKi4SUB6BPxixzgNyzVy6n7W1x8LxE3Fxv4',
    };
  }

  async status(): Promise<NodeStatusResult> {
    throw new Error('NOOP');
  }

  async sendTransaction(
    signedTransaction: SignedTransaction,
  ): Promise<FinalExecutionOutcome> {
    throw new Error('NOOP');
  }

  async sendTransactionAsync(
    signedTransaction: SignedTransaction,
  ): Promise<FinalExecutionOutcome> {
    throw new Error('NOOP');
  }

  async txStatus(
    txHash: Uint8Array | string,
    accountId: string,
  ): Promise<FinalExecutionOutcome> {
    throw new Error('NOOP');
  }

  async txStatusReceipts(
    txHash: Uint8Array,
    accountId: string,
  ): Promise<FinalExecutionOutcome> {
    throw new Error('NOOP');
  }

  async block(blockQuery: BlockId | BlockReference): Promise<BlockResult> {
    throw new Error('NOOP');
  }

  async blockChanges(
    blockQuery: BlockId | BlockReference,
  ): Promise<BlockChangeResult> {
    throw new Error('NOOP');
  }

  async chunk(chunkId: ChunkId): Promise<ChunkResult> {
    throw new Error('NOOP');
  }

  async validators(blockId: BlockId): Promise<EpochValidatorInfo> {
    throw new Error('NOOP');
  }

  async experimental_genesisConfig(): Promise<NearProtocolConfig> {
    throw new Error('NOOP');
  }

  async experimental_protocolConfig(
    blockReference: BlockReference,
  ): Promise<NearProtocolConfig> {
    throw new Error('NOOP');
  }

  async lightClientProof(
    request: LightClientProofRequest,
  ): Promise<LightClientProof> {
    throw new Error('NOOP');
  }

  async gasPrice(blockId: BlockId): Promise<GasPrice> {
    throw new Error('NOOP');
  }

  async accessKeyChanges(
    accountIdArray: string[],
    BlockQuery: BlockId | BlockReference,
  ): Promise<ChangeResult> {
    throw new Error('NOOP');
  }

  async singleAccessKeyChanges(
    accessKeyArray: AccessKeyWithPublicKey[],
    BlockQuery: BlockId | BlockReference,
  ): Promise<ChangeResult> {
    throw new Error('NOOP');
  }

  async accountChanges(
    accountIdArray: string[],
    BlockQuery: BlockId | BlockReference,
  ): Promise<ChangeResult> {
    throw new Error('NOOP');
  }

  async contractStateChanges(
    accountIdArray: string[],
    BlockQuery: BlockId | BlockReference,
    keyPrefix: string,
  ): Promise<ChangeResult> {
    throw new Error('NOOP');
  }

  async contractCodeChanges(
    accountIdArray: string[],
    BlockQuery: BlockId | BlockReference,
  ): Promise<ChangeResult> {
    throw new Error('NOOP');
  }
}

export const createTestKeyStore = (signerId = 'my-acct.testnet') => {
  const keyPair = KeyPair.fromString(
    'ed25519:5eGhUdBAbie8EAQgJKj3hyuXb6pkVit21uWprBmJjDntPgRCCwprFDqtKv1B4EgqMUjtHmU5yj6t5R2jZx2vFRpN',
  );

  const keyStore = new InMemoryKeyStore();
  keyStore.setKey('testnet', signerId, keyPair);

  return keyStore;
};

export const createTestTransactionCreator = (signerId = 'my-acct.testnet') => new KeyStoreTransactionCreator({
  keyStore: createTestKeyStore(signerId),
  signerId,
  networkId: 'testnet',
  provider: new MockProvider(),
});

export const createTestTranasctionSigner = (signerId = 'my-acct.testnet') => new KeyStoreTransactionSigner({
  keyStore: createTestKeyStore(signerId),
  signerId,
  networkId: 'testnet',
});
