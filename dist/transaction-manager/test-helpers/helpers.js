"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestTranasctionSigner = exports.createTestTransactionCreator = exports.createTestKeyStore = exports.MockProvider = void 0;
const near_api_js_1 = require("near-api-js");
const key_stores_1 = require("near-api-js/lib/key_stores");
const creator_1 = require("../creator");
const signer_1 = require("../signer");
class MockProvider {
    async query() {
        return {
            nonce: 345,
            permission: 'FullAccess',
            block_height: 1,
            block_hash: 'CCLc18qkRTKi4SUB6BPxixzgNyzVy6n7W1x8LxE3Fxv4',
        };
    }
    async status() {
        throw new Error('NOOP');
    }
    async sendTransaction(signedTransaction) {
        throw new Error('NOOP');
    }
    async sendTransactionAsync(signedTransaction) {
        throw new Error('NOOP');
    }
    async txStatus(txHash, accountId) {
        throw new Error('NOOP');
    }
    async txStatusReceipts(txHash, accountId) {
        throw new Error('NOOP');
    }
    async block(blockQuery) {
        throw new Error('NOOP');
    }
    async blockChanges(blockQuery) {
        throw new Error('NOOP');
    }
    async chunk(chunkId) {
        throw new Error('NOOP');
    }
    async validators(blockId) {
        throw new Error('NOOP');
    }
    async experimental_genesisConfig() {
        throw new Error('NOOP');
    }
    async experimental_protocolConfig(blockReference) {
        throw new Error('NOOP');
    }
    async lightClientProof(request) {
        throw new Error('NOOP');
    }
    async gasPrice(blockId) {
        throw new Error('NOOP');
    }
    async accessKeyChanges(accountIdArray, BlockQuery) {
        throw new Error('NOOP');
    }
    async singleAccessKeyChanges(accessKeyArray, BlockQuery) {
        throw new Error('NOOP');
    }
    async accountChanges(accountIdArray, BlockQuery) {
        throw new Error('NOOP');
    }
    async contractStateChanges(accountIdArray, BlockQuery, keyPrefix) {
        throw new Error('NOOP');
    }
    async contractCodeChanges(accountIdArray, BlockQuery) {
        throw new Error('NOOP');
    }
}
exports.MockProvider = MockProvider;
const createTestKeyStore = (signerId = 'my-acct.testnet') => {
    const keyPair = near_api_js_1.KeyPair.fromString('ed25519:5eGhUdBAbie8EAQgJKj3hyuXb6pkVit21uWprBmJjDntPgRCCwprFDqtKv1B4EgqMUjtHmU5yj6t5R2jZx2vFRpN');
    const keyStore = new key_stores_1.InMemoryKeyStore();
    keyStore.setKey('testnet', signerId, keyPair);
    return keyStore;
};
exports.createTestKeyStore = createTestKeyStore;
const createTestTransactionCreator = (signerId = 'my-acct.testnet') => new creator_1.KeyStoreTransactionCreator({
    keyStore: exports.createTestKeyStore(signerId),
    signerId,
    networkId: 'testnet',
    provider: new MockProvider(),
});
exports.createTestTransactionCreator = createTestTransactionCreator;
const createTestTranasctionSigner = (signerId = 'my-acct.testnet') => new signer_1.KeyStoreTransactionSigner({
    keyStore: exports.createTestKeyStore(signerId),
    signerId,
    networkId: 'testnet',
});
exports.createTestTranasctionSigner = createTestTranasctionSigner;
//# sourceMappingURL=helpers.js.map