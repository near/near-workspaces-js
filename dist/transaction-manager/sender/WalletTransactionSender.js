"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletTransactionSender = void 0;
/**
 * This is an implementation of {@link TransactionSender}. It is used to send
 * transactions by sending the to the NEAR wallet via redirect.
 *
 *
 * @example
 * ```ts
 * const transactionSender = new WalletTransactionSender({ wallet })
 * ```
 */
class WalletTransactionSender {
    constructor({ wallet }) {
        this.wallet = wallet;
    }
    /**
     * @see {@link TransactionSender.send}
     */
    async send(signedTransaction) {
        return this.wallet._near.connection.provider.sendTransaction(signedTransaction);
    }
    /**
     * @see {@link TransactionSender.createSignAndSend}
     */
    async createSignAndSend({ transactionOptions, }) {
        // @ts-expect-error
        return this.wallet.account().signAndSendTransaction({
            receiverId: transactionOptions.receiverId,
            actions: transactionOptions.actions,
        });
    }
    /**
     * @see {@link TransactionSender.bundleCreateSignAndSend}
     */
    async bundleCreateSignAndSend({ bundleTransactionOptions, transactionCreator, }) {
        const transactions = await Promise.all(bundleTransactionOptions.map(async (option, i) => transactionCreator.create({ ...option, nonceOffset: i + 1 })));
        await this.wallet.requestSignTransactions({ transactions });
        return [];
    }
}
exports.WalletTransactionSender = WalletTransactionSender;
//# sourceMappingURL=WalletTransactionSender.js.map