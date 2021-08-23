import {Action, ExecutionOutcome, ExecutionOutcomeWithId, FinalExecutionOutcome, PublicKey} from './types';

function includes(pattern: string | RegExp): (s: string) => boolean {
  if (typeof pattern === 'string') {
    return s => s.includes(pattern);
  }

  return s => (pattern).test(s);
}

export class ExecutionResult {
  constructor(public readonly result: FinalExecutionOutcome) {}

  get outcomesWithId(): ExecutionOutcomeWithId[] {
    const {result} = this;
    return [result.transaction_outcome, ...result.receipts_outcome];
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

  get succeeded(): boolean {
    if (typeof this.result.status === 'string') {
      return false;
    }

    if (this.result.status.SuccessValue) {
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
