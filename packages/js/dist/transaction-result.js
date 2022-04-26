"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionError = exports.TransactionResult = exports.ReceiptOutcome = void 0;
const buffer_1 = require("buffer");
const near_units_1 = require("near-units");
function includes(pattern) {
    if (typeof pattern === 'string') {
        return s => s.includes(pattern);
    }
    return s => pattern.test(s);
}
function parseValue(value) {
    const buffer = buffer_1.Buffer.from(value, 'base64').toString();
    try {
        return JSON.parse(buffer);
    }
    catch {
        return buffer;
    }
}
class ReceiptOutcome {
    constructor(outcome) {
        this.outcome = outcome;
    }
    get failures() {
        return [];
    }
    get status() {
        return this.outcome.status;
    }
    get succeeded() {
        if (typeof this.status === 'string') {
            return false;
        }
        return this.status.SuccessValue !== undefined;
    }
    get isFailure() {
        if (typeof this.status === 'string') {
            return false;
        }
        return this.status.Failure !== undefined;
    }
    get executionStatus() {
        return this.status;
    }
    parseResult() {
        if (this.succeeded) {
            return parseValue(this.SuccessValue);
        }
        throw new Error(JSON.stringify(this.status));
    }
    get SuccessValue() {
        if (this.succeeded) {
            return this.executionStatus.SuccessValue;
        }
        return undefined;
    }
    get executionFailure() {
        if (this.isFailure) {
            return this.executionStatus.Failure;
        }
        return undefined;
    }
    get failureMessage() {
        var _a;
        return (_a = this.executionFailure) === null || _a === void 0 ? void 0 : _a.error_message;
    }
    get failureType() {
        var _a;
        return (_a = this.executionFailure) === null || _a === void 0 ? void 0 : _a.error_type;
    }
    get logs() {
        return this.outcome.logs;
    }
    get gas_burnt() {
        return near_units_1.Gas.from(this.outcome.gas_burnt);
    }
}
exports.ReceiptOutcome = ReceiptOutcome;
class TransactionResult {
    constructor(result, startMs, endMs, config) {
        this.result = result;
        this.startMs = startMs;
        this.endMs = endMs;
        this.config = config;
    }
    get durationMs() {
        return this.endMs - this.startMs;
    }
    get outcomesWithId() {
        const { result } = this;
        return [result.transaction_outcome, ...result.receipts_outcome];
    }
    get receipts_outcomes() {
        return this.result.receipts_outcome.flatMap(o => new ReceiptOutcome(o.outcome));
    }
    get outcome() {
        return this.result.transaction_outcome.outcome;
    }
    get outcomes() {
        return this.outcomesWithId.flatMap(o => o.outcome);
    }
    get logs() {
        return this.outcomes.flatMap(it => it.logs);
    }
    get transactionReceipt() {
        return this.result.transaction;
    }
    get failures() {
        const failures = [...this.receiptFailures];
        if (this.Failure) {
            failures.unshift(this.Failure);
        }
        return failures;
    }
    get status() {
        return this.result.status;
    }
    get succeeded() {
        if (typeof this.result.status === 'string') {
            return false;
        }
        return this.result.status.SuccessValue !== undefined;
    }
    get SuccessValue() {
        if (this.succeeded) {
            return this.finalExecutionStatus.SuccessValue;
        }
        return null;
    }
    get failed() {
        if (typeof this.result.status === 'string') {
            return false;
        }
        return this.result.status.Failure !== undefined;
    }
    get Failure() {
        if (this.failed) {
            return this.finalExecutionStatus.Failure;
        }
        return null;
    }
    logsContain(pattern) {
        return this.logs.some(includes(pattern));
    }
    findLogs(pattern) {
        return this.logs.filter(includes(pattern));
    }
    receiptSuccessValuesContain(pattern) {
        return this.receiptSuccessValues.some(includes(pattern));
    }
    findReceiptSuccessValues(pattern) {
        return this.receiptSuccessValues.filter(includes(pattern));
    }
    get finalExecutionStatus() {
        return this.status;
    }
    get receiptFailures() {
        return this.receipts_outcomes.flatMap(o => { var _a; return (_a = o.executionFailure) !== null && _a !== void 0 ? _a : []; });
    }
    get receiptSuccessValues() {
        return this.receipts_outcomes.flatMap(o => { var _a; return (_a = o.SuccessValue) !== null && _a !== void 0 ? _a : []; });
    }
    get receiptFailureMessages() {
        return this.receiptFailures.map(failure => JSON.stringify(failure));
    }
    get gas_burnt() {
        return near_units_1.Gas.from(this.result.transaction_outcome.outcome.gas_burnt);
    }
    receiptFailureMessagesContain(pattern) {
        return this.receiptFailureMessages.some(includes(pattern));
    }
    parseResult() {
        if (this.succeeded) {
            return parseValue(this.SuccessValue);
        }
        throw new Error(JSON.stringify(this.status));
    }
    parsedReceiptResults() {
        return this.receiptSuccessValues.map(parseValue);
    }
    summary() {
        return `(${this.durationMs} ms) burned ${this.gas_burnt.toHuman()} ${transactionReceiptToString(this.transactionReceipt, this.config.explorerUrl)}`;
    }
}
exports.TransactionResult = TransactionResult;
function transactionReceiptToString(tx, explorerUrl) {
    return `${tx.signer_id} -> ${tx.receiver_id} Nonce: ${tx.nonce} Hash: ${explorerUrl ? explorerUrl + '/' : ''}${tx.hash} Actions:\n${tx.actions.map(a => JSON.stringify(a)).join('\n')}`;
}
class TransactionError extends Error {
    constructor(result) {
        super(JSON.stringify(result));
    }
    parse() {
        return JSON.parse(this.message);
    }
}
exports.TransactionError = TransactionError;
//# sourceMappingURL=transaction-result.js.map