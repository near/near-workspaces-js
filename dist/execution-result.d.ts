import { Action, ExecutionError, ExecutionOutcome, ExecutionOutcomeWithId, ExecutionStatus, ExecutionStatusBasic, FinalExecutionOutcome, FinalExecutionStatus, FinalExecutionStatusBasic, PublicKey } from './types';
export declare class PromiseOutcome {
    outcome: ExecutionOutcome;
    constructor(outcome: ExecutionOutcome);
    get errors(): Array<Record<string, unknown>>;
    get status(): ExecutionStatus | ExecutionStatusBasic;
    get succeeded(): boolean;
    get isFailure(): boolean;
    get executionStatus(): ExecutionStatus;
    parseResult(): any;
    get SuccessValue(): string | undefined;
    get executionError(): ExecutionError | undefined;
    get errorMessage(): string | undefined;
    get errorType(): string | undefined;
    get logs(): string[];
}
export declare class ExecutionResult {
    readonly result: FinalExecutionOutcome;
    readonly startMs: number;
    readonly endMs: number;
    constructor(result: FinalExecutionOutcome, startMs: number, endMs: number);
    get durationMs(): number;
    get outcomesWithId(): ExecutionOutcomeWithId[];
    get receipts_outcomes(): PromiseOutcome[];
    get outcome(): ExecutionOutcome[];
    get outcomes(): ExecutionOutcome[];
    get logs(): string[];
    get transactionReceipt(): TransactionReceipt;
    get errors(): Array<Record<string, unknown>>;
    get status(): FinalExecutionStatus | FinalExecutionStatusBasic;
    get succeeded(): boolean;
    logsContain(pattern: string | RegExp): boolean;
    findLogs(pattern: string | RegExp): string[];
    promiseValuesContain(pattern: string | RegExp): boolean;
    findPromiseValues(pattern: string | RegExp): string[];
    get finalExecutionStatus(): FinalExecutionStatus;
    get SuccessValue(): string | null;
    get promiseErrors(): ExecutionError[];
    get promiseSuccessValues(): string[];
    get promiseErrorMessages(): string[];
    promiseErrorMessagesContain(pattern: string | RegExp): boolean;
    parseResult(): any;
    parsedPromiseResults(): any[];
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
