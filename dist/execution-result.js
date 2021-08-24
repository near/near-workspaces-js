"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionResult = exports.PromiseOutcome = void 0;
const buffer_1 = require("buffer");
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
class PromiseOutcome {
    constructor(outcome) {
        this.outcome = outcome;
    }
    get errors() {
        return [];
    }
    get status() {
        return this.outcome.status;
    }
    get succeeded() {
        if (typeof this.status === 'string') {
            return false;
        }
        if (this.status.SuccessValue !== undefined) {
            return true;
        }
        return false;
    }
    get isFailure() {
        if (typeof this.status === 'string') {
            return false;
        }
        if (this.status.Failure !== undefined) {
            return true;
        }
        return false;
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
    get executionError() {
        if (this.isFailure) {
            return this.executionStatus.Failure;
        }
        return undefined;
    }
    get errorMessage() {
        var _a;
        return (_a = this.executionError) === null || _a === void 0 ? void 0 : _a.error_message;
    }
    get errorType() {
        var _a;
        return (_a = this.executionError) === null || _a === void 0 ? void 0 : _a.error_type;
    }
    get logs() {
        return this.outcome.logs;
    }
}
exports.PromiseOutcome = PromiseOutcome;
class ExecutionResult {
    constructor(result, durationMs) {
        this.result = result;
        this.durationMs = durationMs;
    }
    get outcomesWithId() {
        const { result } = this;
        return [result.transaction_outcome, ...result.receipts_outcome];
    }
    get receipts_outcomes() {
        return this.result.receipts_outcome.flatMap(o => new PromiseOutcome(o.outcome));
    }
    get outcome() {
        return this.outcomesWithId.flatMap(o => o.outcome);
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
    get errors() {
        return [];
    }
    get status() {
        return this.result.status;
    }
    get succeeded() {
        if (typeof this.result.status === 'string') {
            return false;
        }
        if (this.result.status.SuccessValue !== undefined) {
            return true;
        }
        return false;
    }
    logsContain(pattern) {
        return this.logs.some(includes(pattern));
    }
    findLogs(pattern) {
        return this.logs.filter(includes(pattern));
    }
    get finalExecutionStatus() {
        return this.status;
    }
    get SuccessValue() {
        if (this.succeeded) {
            return this.finalExecutionStatus.SuccessValue;
        }
        return null;
    }
    parseResult() {
        if (this.succeeded) {
            return parseValue(this.SuccessValue);
        }
        throw new Error(JSON.stringify(this.status));
    }
    promiseErrors() {
        return this.receipts_outcomes.flatMap(o => { var _a; return (_a = o.executionError) !== null && _a !== void 0 ? _a : []; });
    }
}
exports.ExecutionResult = ExecutionResult;
//# sourceMappingURL=execution-result.js.map