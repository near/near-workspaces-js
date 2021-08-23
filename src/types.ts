import _BN from 'bn.js';

export {KeyPair, Connection} from 'near-api-js';
export {PublicKey, KeyPairEd25519} from 'near-api-js/lib/utils';
export {
  Action,
  createAccount,
  deployContract,
  functionCall,
  transfer,
  stake,
  addKey,
  deleteKey,
  deleteAccount,
  fullAccessKey,
  AccessKey,
} from 'near-api-js/lib/transaction';
export {AccountBalance} from 'near-api-js/lib/account';
export {JsonRpcProvider} from 'near-api-js/lib/providers/json-rpc-provider';
export {KeyStore} from 'near-api-js/lib/key_stores';
export * from 'near-api-js/lib/providers/provider';

export {DEFAULT_FUNCTION_CALL_GAS} from 'near-api-js/lib/constants';

export class BN extends _BN {
  toJSON(): string {
    return this.toString(10);
  }
}

// Need to fill out all record types
export interface DataRecord {
  Data: {account_id: string; data_key: string; value: string};
}

export type Record = DataRecord;
export interface Records {
  records: Record[];
}
