"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionResult = void 0;
function includes(pattern) {
    if (typeof pattern === 'string') {
        return s => s.includes(pattern);
    }
    return s => (pattern).test(s);
}
class ExecutionResult {
    constructor(result) {
        this.result = result;
    }
    get outcomesWithId() {
        const { result } = this;
        return [result.transaction_outcome, ...result.receipts_outcome];
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
    get succeeded() {
        if (typeof this.result.status === 'string') {
            return false;
        }
        if (this.result.status.SuccessValue) {
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
}
exports.ExecutionResult = ExecutionResult;
//# sourceMappingURL=execution-result.js.map