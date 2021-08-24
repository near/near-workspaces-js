import {Buffer} from 'buffer';
import {
  Action,
  ExecutionError,
  ExecutionOutcome,
  ExecutionOutcomeWithId,
  ExecutionStatus,
  ExecutionStatusBasic,
  FinalExecutionOutcome,
  FinalExecutionStatus,
  FinalExecutionStatusBasic,
  PublicKey,
} from './types';

function includes(pattern: string | RegExp): (s: string) => boolean {
  if (typeof pattern === 'string') {
    return s => s.includes(pattern);
  }

  return s => pattern.test(s);
}

function parseValue(value: string): any {
  const buffer = Buffer.from(
    value,
    'base64',
  ).toString();
  try {
    return JSON.parse(buffer);
  } catch {
    return buffer;
  }
}

export class PromiseOutcome {
  constructor(public outcome: ExecutionOutcome) {}

  get errors(): Array<Record<string, unknown>> {
    return [];
  }

  get status(): ExecutionStatus | ExecutionStatusBasic {
    return this.outcome.status;
  }

  get succeeded(): boolean {
    if (typeof this.status === 'string') {
      return false;
    }

    if (this.status.SuccessValue !== undefined) {
      return true;
    }

    return false;
  }

  get isFailure(): boolean {
    if (typeof this.status === 'string') {
      return false;
    }

    if (this.status.Failure !== undefined) {
      return true;
    }

    return false;
  }

  get executionStatus(): ExecutionStatus {
    return this.status as ExecutionStatus;
  }

  parseResult(): any {
    if (this.succeeded) {
      return parseValue(this.SuccessValue!);
    }

    throw new Error(JSON.stringify(this.status));
  }

  get SuccessValue(): string | undefined {
    if (this.succeeded) {
      return this.executionStatus.SuccessValue!;
    }

    return undefined;
  }

  get executionError(): ExecutionError | undefined {
    if (this.isFailure) {
      return this.executionStatus.Failure!;
    }

    return undefined;
  }

  get errorMessage(): string | undefined {
    return this.executionError?.error_message;
  }

  get errorType(): string | undefined {
    return this.executionError?.error_type;
  }

  get logs(): string[] {
    return this.outcome.logs;
  }
}

export class ExecutionResult {
  constructor(public readonly result: FinalExecutionOutcome, public readonly durationMs: number) {}

  get outcomesWithId(): ExecutionOutcomeWithId[] {
    const {result} = this;
    return [result.transaction_outcome, ...result.receipts_outcome];
  }

  get receipts_outcomes(): PromiseOutcome[] {
    return this.result.receipts_outcome.flatMap(o => new PromiseOutcome(o.outcome));
  }

  get outcome(): ExecutionOutcome[] {
    return this.outcomesWithId.flatMap(o => o.outcome);
  }

  get outcomes(): ExecutionOutcome[] {
    return this.outcomesWithId.flatMap(o => o.outcome);
  }

  get logs(): string[] {
    return this.outcomes.flatMap(it => it.logs);
  }

  get transactionReceipt(): TransactionReceipt {
    return this.result.transaction as TransactionReceipt;
  }

  get errors(): Array<Record<string, unknown>> {
    return [];
  }

  get status(): FinalExecutionStatus | FinalExecutionStatusBasic {
    return this.result.status;
  }

  get succeeded(): boolean {
    if (typeof this.result.status === 'string') {
      return false;
    }

    if (this.result.status.SuccessValue !== undefined) {
      return true;
    }

    return false;
  }

  logsContain(pattern: string | RegExp): boolean {
    return this.logs.some(includes(pattern));
  }

  findLogs(pattern: string | RegExp): string[] {
    return this.logs.filter(includes(pattern));
  }

  get finalExecutionStatus(): FinalExecutionStatus {
    return this.status as FinalExecutionStatus;
  }

  get SuccessValue(): string | null {
    if (this.succeeded) {
      return this.finalExecutionStatus.SuccessValue!;
    }

    return null;
  }

  parseResult(): any {
    if (this.succeeded) {
      return parseValue(this.SuccessValue!);
    }

    throw new Error(JSON.stringify(this.status));
  }

  promiseErrors(): ExecutionError[] {
    return this.receipts_outcomes.flatMap(o => o.executionError ?? []);
  }
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
