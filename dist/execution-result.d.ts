import { Action, ExecutionOutcome, ExecutionOutcomeWithId, FinalExecutionOutcome, PublicKey } from './types';
export declare class ExecutionResult {
    readonly result: FinalExecutionOutcome;
    constructor(result: FinalExecutionOutcome);
    get outcomesWithId(): ExecutionOutcomeWithId[];
    get outcomes(): ExecutionOutcome[];
    get logs(): string[];
    get transactionReceipt(): TransactionReceipt;
    get errors(): Array<Record<string, unknown>>;
    get succeeded(): boolean;
    logsContain(pattern: string | RegExp): boolean;
    findLogs(pattern: string | RegExp): string[];
}
export interface TransactionReceipt {
    action: Action[];
    hash: string;
    nonce: number;
    public_key: PublicKey;
    receiver_id: string;
    signature: string;
    signer_id: string;
}
