import _BN from 'bn.js';

export {KeyPair} from 'near-api-js';
export {PublicKey} from 'near-api-js/lib/utils';
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

export {DEFAULT_FUNCTION_CALL_GAS} from 'near-api-js/lib/constants';

export class BN extends _BN {
  toJSON(): string {
    return this.toString(10);
  }
}
