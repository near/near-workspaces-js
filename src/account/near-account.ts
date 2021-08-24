import {URL} from 'url';
import {Buffer} from 'buffer';
import BN from 'bn.js';
import {KeyPair} from 'near-api-js';
import {AccountBalance, PublicKey, FinalExecutionOutcome, CodeResult} from '../types';
import {ContractState} from '../contract-state';
import {Transaction} from '../transaction';

export interface NearAccount {
  accountId: string;

  balance(): Promise<AccountBalance>;

  createTransaction(receiver: NearAccount | string): Transaction;

  exists(): Promise<boolean>;

  getKey(): Promise<KeyPair | null>;

  setKey(keyPair: KeyPair): Promise<PublicKey>;

  createAccount(
    accountId: string,
    options?: {keyPair?: KeyPair; initialBalance?: string},
  ): Promise<NearAccount>;

  /** Adds suffix to accountId if account isn't sub account or have full including top level account */
  getAccount(accountId: string): NearAccount;

  createAndDeploy(
    accountId: string,
    wasm: string | URL | Uint8Array | Buffer,
    options?: {
      args?: Record<string, unknown> | Uint8Array;
      attachedDeposit?: string | BN;
      gas?: string | BN;
      initialBalance?: BN | string;
      keyPair?: KeyPair;
      method?: string;
    },
  ): Promise<NearAccount>;

  /**
   * Call a NEAR contract and return full results with raw receipts, etc. Example:
   *
   *     await call('lol.testnet', 'set_status', { message: 'hello' }, new BN(30 * 10**12), '0')
   *
   * @returns nearAPI.providers.FinalExecutionOutcome
   */
  call_raw(
    contractId: NearAccount | string,
    methodName: string,
    args: Record<string, unknown>,
    options?: {
      gas?: string | BN;
      attachedDeposit?: string | BN;
      signWithKey?: KeyPair;
    },
  ): Promise<FinalExecutionOutcome>;

  /**
   * Convenient wrapper around lower-level `call_raw` that returns only successful result of call, or throws error encountered during call.  Example:
   *
   *     await call('lol.testnet', 'set_status', { message: 'hello' }, new BN(30 * 10**12), '0')
   *
   * @returns any parsed return value, or throws with an error if call failed
   */
  call(
    contractId: NearAccount | string,
    methodName: string,
    args: Record<string, unknown>,
    options?: {
      gas?: string | BN;
      attachedDeposit?: string | BN;
      signWithKey?: KeyPair;
    },
  ): Promise<any>;

  view_raw(method: string, args: Record<string, unknown>): Promise<CodeResult>;

  view<T>(method: string, args: Record<string, unknown>): Promise<T>;

  viewState(): Promise<ContractState> ;

  patchState(key: string, value_: any, borshSchema?: any): Promise<any>;

  /** Delete account and sends funds to beneficiaryId */
  delete(beneficiaryId: string): Promise<FinalExecutionOutcome>;

  makeSubAccount(accountId: string): string;

  subAccountOf(accountId: string): boolean;

  toJSON(): string;

}

