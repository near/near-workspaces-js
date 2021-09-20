import {Buffer} from 'buffer';
import {Gas} from 'near-units';
import {
  Action,
  ClientConfig,
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

function parseValue<T>(value: string): T | string {
  const buffer = Buffer.from(value, 'base64').toString();
  try {
    return JSON.parse(buffer) as T;
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

    return this.status.SuccessValue !== undefined;
  }

  get isFailure(): boolean {
    if (typeof this.status === 'string') {
      return false;
    }

    return this.status.Failure !== undefined;
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

  get gas_burnt(): Gas {
    return Gas.from(this.outcome.gas_burnt);
  }
}

export class TransactionResult {
  constructor(
    public readonly result: FinalExecutionOutcome,
    public readonly startMs: number,
    public readonly endMs: number,
    private readonly config: ClientConfig,
  ) {}

  get durationMs(): number {
    return this.endMs - this.startMs;
  }

  get outcomesWithId(): ExecutionOutcomeWithId[] {
    const {result} = this;
    return [result.transaction_outcome, ...result.receipts_outcome];
  }

  get receipts_outcomes(): PromiseOutcome[] {
    return this.result.receipts_outcome.flatMap(
      o => new PromiseOutcome(o.outcome),
    );
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

  get errors(): ExecutionError[] {
    const errors = [...this.promiseErrors];

    if (this.Failure) {
      errors.unshift(this.Failure);
    }

    return errors;
  }

  get status(): FinalExecutionStatus | FinalExecutionStatusBasic {
    return this.result.status;
  }

  get succeeded(): boolean {
    if (typeof this.result.status === 'string') {
      return false;
    }

    return this.result.status.SuccessValue !== undefined;
  }

  get SuccessValue(): string | null {
    if (this.succeeded) {
      return this.finalExecutionStatus.SuccessValue!;
    }

    return null;
  }

  get failed(): boolean {
    if (typeof this.result.status === 'string') {
      return false;
    }

    return this.result.status.Failure !== undefined;
  }

  get Failure(): ExecutionError | null {
    if (this.failed) {
      return this.finalExecutionStatus.Failure!;
    }

    return null;
  }

  logsContain(pattern: string | RegExp): boolean {
    return this.logs.some(includes(pattern));
  }

  findLogs(pattern: string | RegExp): string[] {
    return this.logs.filter(includes(pattern));
  }

  promiseValuesContain(pattern: string | RegExp): boolean {
    return this.promiseSuccessValues.some(includes(pattern));
  }

  findPromiseValues(pattern: string | RegExp): string[] {
    return this.promiseSuccessValues.filter(includes(pattern));
  }

  get finalExecutionStatus(): FinalExecutionStatus {
    return this.status as FinalExecutionStatus;
  }

  get promiseErrors(): ExecutionError[] {
    return this.receipts_outcomes.flatMap(o => o.executionError ?? []);
  }

  get promiseSuccessValues(): string[] {
    return this.receipts_outcomes.flatMap(o => o.SuccessValue ?? []);
  }

  get promiseErrorMessages(): string[] {
    return this.promiseErrors.map(error => JSON.stringify(error));
  }

  get gas_burnt(): Gas {
    return Gas.from(this.result.transaction_outcome.outcome.gas_burnt);
  }

  promiseErrorMessagesContain(pattern: string | RegExp): boolean {
    return this.promiseErrorMessages.some(includes(pattern));
  }

  parseResult<T>(): T {
    if (this.succeeded) {
      return parseValue<T>(this.SuccessValue!) as T;
    }

    throw new Error(JSON.stringify(this.status));
  }

  parsedPromiseResults(): any[] {
    return this.promiseSuccessValues.map(parseValue);
  }

  summary(): string {
    return `(${this.durationMs} ms) burned ${this.gas_burnt.toHuman()} ${transactionReceiptToString(this.transactionReceipt, this.config.explorerUrl)}`;
  }
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

function transactionReceiptToString(tx: TransactionReceipt, explorerUrl?: string): string {
  return `${tx.signer_id} -> ${tx.receiver_id} Nonce: ${tx.nonce} Hash: ${explorerUrl ? explorerUrl + '/' : ''}${tx.hash} Actions:\n${tx.actions.map(a => JSON.stringify(a)).join('\n')}`;
}

export class TransactionError extends Error {
  constructor(result: TransactionResult) {
    super(JSON.stringify(result));
  }

  parse(): ExecutionOutcome {
    return JSON.parse(this.message) as ExecutionOutcome;
  }
}

export type TxResult = TransactionResult;
