import { Gas } from 'near-units';
import { Action, ClientConfig, ExecutionError, ExecutionOutcome, ExecutionOutcomeWithId, ExecutionStatus, ExecutionStatusBasic, FinalExecutionOutcome, FinalExecutionStatus, FinalExecutionStatusBasic, PublicKey } from './types';
export declare class ReceiptOutcome {
    outcome: ExecutionOutcome;
    constructor(outcome: ExecutionOutcome);
    get failures(): Array<Record<string, unknown>>;
    get status(): ExecutionStatus | ExecutionStatusBasic;
    get succeeded(): boolean;
    get isFailure(): boolean;
    get executionStatus(): ExecutionStatus;
    parseResult(): any;
    get SuccessValue(): string | undefined;
    get executionFailure(): ExecutionError | undefined;
    get failureMessage(): string | undefined;
    get failureType(): string | undefined;
    get logs(): string[];
    get gas_burnt(): Gas;
}
export declare class TransactionResult {
    readonly result: FinalExecutionOutcome;
    readonly startMs: number;
    readonly endMs: number;
    private readonly config;
    constructor(result: FinalExecutionOutcome, startMs: number, endMs: number, config: ClientConfig);
    get durationMs(): number;
    get outcomesWithId(): ExecutionOutcomeWithId[];
    get receipts_outcomes(): ReceiptOutcome[];
    get outcome(): ExecutionOutcome;
    get outcomes(): ExecutionOutcome[];
    get logs(): string[];
    get transactionReceipt(): TransactionReceipt;
    get failures(): ExecutionError[];
    get status(): FinalExecutionStatus | FinalExecutionStatusBasic;
    get succeeded(): boolean;
    get SuccessValue(): string | null;
    get failed(): boolean;
    get Failure(): ExecutionError | null;
    logsContain(pattern: string | RegExp): boolean;
    findLogs(pattern: string | RegExp): string[];
    receiptSuccessValuesContain(pattern: string | RegExp): boolean;
    findReceiptSuccessValues(pattern: string | RegExp): string[];
    get finalExecutionStatus(): FinalExecutionStatus;
    get receiptFailures(): ExecutionError[];
    get receiptSuccessValues(): string[];
    get receiptFailureMessages(): string[];
    get gas_burnt(): Gas;
    receiptFailureMessagesContain(pattern: string | RegExp): boolean;
    parseResult<T>(): T;
    parsedReceiptResults(): any[];
    summary(): string;
}
export interface TransactionReceipt {
    actions: Action[];
    hash: string;
    nonce: number;
    public_key: PublicKey;
    receiver_id: string;
    signature: string;
    signer_id: string;
}
export declare class TransactionError extends Error {
    constructor(result: TransactionResult);
    parse(): ExecutionOutcome;
}
export type TxResult = TransactionResult;
//# sourceMappingURL=transaction-result.d.ts.map