import {KeyPair} from 'near-api-js';
import {NEAR} from '../interfaces';
import {JSONRpc} from '../provider';
import {Transaction} from '../runtime/transaction';
import {AccountBalance, FinalExecutionOutcome} from '../types';
import {NearAccount} from './near-account';

export interface NearAccountManager {
  readonly provider: JSONRpc;
  readonly initialBalance: string;
  readonly root: NearAccount;
  balance(accountId: string | NearAccount): Promise<AccountBalance>;
  executeTransaction(tx: Transaction, keyPair?: KeyPair): Promise<FinalExecutionOutcome>;
  addAccountCreated(account: string, sender: string): void;
  getAccount(accountId: string): NearAccount;
  getKey(accountId: string): Promise<KeyPair | null>;
  deleteAccount(accountId: string, beneficiaryId: string): Promise<void>;
  deleteKey(accountId: string): Promise<void>;
  /** Creates a KeyPair if one is not provided */
  setKey(accountId: string, keyPair?: KeyPair): Promise<KeyPair>;
  createTransaction(sender: NearAccount | string, receiver: NearAccount | string): Transaction;
  createFrom(near: NEAR): Promise<NearAccountManager>;
}
