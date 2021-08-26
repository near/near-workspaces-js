"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderTransactionSender = void 0;
/**
 * This is an implementation of {@link TransactionSender}. It is used to send
 * transactions with a `Provider` from `near-api-js`.
 *
 *
 * @example
 * ```ts
 * const transactionSender = new ProviderTransactionSender({ provider: near.connection.provider })
 * ```
 */
class ProviderTransactionSender {
    constructor({ provider }) {
        this.provider = provider;
    }
    /**
     * @see {@link TransactionSender.send}
     */
    async send(signedTransaction) {
        return this.provider.sendTransaction(signedTransaction);
    }
    /**
     * @see {@link TransactionSender.createSignAndSend}
     */
    async createSignAndSend({ transactionOptions, transactionCreator, transactionSigner, }) {
        const transaction = await transactionCreator.create(transactionOptions);
        const signedTransaction = await transactionSigner.sign({ transaction });
        return this.provider.sendTransaction(signedTransaction);
    }
    /**
     * @see {@link TransactionSender.bundleCreateSignAndSend}
     */
    async bundleCreateSignAndSend({ bundleTransactionOptions, transactionCreator, transactionSigner, }) {
        const outcomes = [];
        for (const [i, transactionOptions] of bundleTransactionOptions.entries()) {
            outcomes.push(await this.createSignAndSend({
                transactionOptions: { ...transactionOptions, nonceOffset: i + 1 },
                transactionCreator,
                transactionSigner,
            }));
        }
        return outcomes;
    }
}
exports.ProviderTransactionSender = ProviderTransactionSender;
//# sourceMappingURL=ProviderTransactionSender.js.map