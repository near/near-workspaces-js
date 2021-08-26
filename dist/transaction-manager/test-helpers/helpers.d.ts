import { InMemoryKeyStore } from 'near-api-js/lib/key_stores';
import { Provider } from 'near-api-js/lib/providers';
import { AccessKeyWithPublicKey, BlockChangeResult, BlockId, BlockReference, BlockResult, ChangeResult, ChunkId, ChunkResult, EpochValidatorInfo, FinalExecutionOutcome, GasPrice, LightClientProof, LightClientProofRequest, NearProtocolConfig, NodeStatusResult } from 'near-api-js/lib/providers/provider';
import { SignedTransaction } from 'near-api-js/lib/transaction';
import { KeyStoreTransactionCreator } from '../creator';
import { KeyStoreTransactionSigner } from '../signer';
export declare class MockProvider implements Provider {
    query(): Promise<{
        nonce: number;
        permission: string;
        block_height: number;
        block_hash: string;
    }>;
    status(): Promise<NodeStatusResult>;
    sendTransaction(signedTransaction: SignedTransaction): Promise<FinalExecutionOutcome>;
    sendTransactionAsync(signedTransaction: SignedTransaction): Promise<FinalExecutionOutcome>;
    txStatus(txHash: Uint8Array | string, accountId: string): Promise<FinalExecutionOutcome>;
    txStatusReceipts(txHash: Uint8Array, accountId: string): Promise<FinalExecutionOutcome>;
    block(blockQuery: BlockId | BlockReference): Promise<BlockResult>;
    blockChanges(blockQuery: BlockId | BlockReference): Promise<BlockChangeResult>;
    chunk(chunkId: ChunkId): Promise<ChunkResult>;
    validators(blockId: BlockId): Promise<EpochValidatorInfo>;
    experimental_genesisConfig(): Promise<NearProtocolConfig>;
    experimental_protocolConfig(blockReference: BlockReference): Promise<NearProtocolConfig>;
    lightClientProof(request: LightClientProofRequest): Promise<LightClientProof>;
    gasPrice(blockId: BlockId): Promise<GasPrice>;
    accessKeyChanges(accountIdArray: string[], BlockQuery: BlockId | BlockReference): Promise<ChangeResult>;
    singleAccessKeyChanges(accessKeyArray: AccessKeyWithPublicKey[], BlockQuery: BlockId | BlockReference): Promise<ChangeResult>;
    accountChanges(accountIdArray: string[], BlockQuery: BlockId | BlockReference): Promise<ChangeResult>;
    contractStateChanges(accountIdArray: string[], BlockQuery: BlockId | BlockReference, keyPrefix: string): Promise<ChangeResult>;
    contractCodeChanges(accountIdArray: string[], BlockQuery: BlockId | BlockReference): Promise<ChangeResult>;
}
export declare const createTestKeyStore: (signerId?: string) => InMemoryKeyStore;
export declare const createTestTransactionCreator: (signerId?: string) => KeyStoreTransactionCreator;
export declare const createTestTranasctionSigner: (signerId?: string) => KeyStoreTransactionSigner;
