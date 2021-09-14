import {Buffer} from 'buffer';
import {KeyPair, NamedAccount, PublicKey} from '../types';
import {AccessKeyData, Account, AccountData, StateRecord} from './types';

export class RecordBuilder {
  readonly records: StateRecord[] = [];

  static fromAccount(accountId: string | Account): AccountBuilder {
    return new AccountBuilder(accountId);
  }

  push(record: StateRecord): this {
    this.records.push(record);
    return this;
  }

  // ToJSON(): string {
  //   return JSON.stringify({records: this.records});
  // }
}

const DEFAULT_ACCOUNT_DATA: AccountData = {
  // 10_000 NEAR
  amount: '10000000000000000000000000000',
  locked: '0',
  // No contract hash
  code_hash: '11111111111111111111111111111111',
  storage_usage: 0,
  version: 'V1',
};

const DEFAULT_ACCESS_KEY_PERMISSION: AccessKeyData
  = {nonce: 0, permission: 'FullAccess'};

export class AccountBuilder extends RecordBuilder {
  readonly account_id: string;
  constructor(accountOrId: string | Account | NamedAccount) {
    super();
    if (typeof accountOrId === 'string') {
      this.account_id = accountOrId;
    } else if (
      'Account' in accountOrId
      && typeof accountOrId.Account.account_id === 'string'
    ) {
      this.account_id = accountOrId.Account.account_id;
      this.push(accountOrId);
    } else if (
      'accountId' in accountOrId
      && typeof accountOrId.accountId === 'string'
    ) {
      this.account_id = accountOrId.accountId;
    } else {
      throw new TypeError(
        'Only `strings` or `Record.Accounts` are not allowed.',
      );
    }
  }

  accessKey(key: string | PublicKey | KeyPair, access_key = DEFAULT_ACCESS_KEY_PERMISSION): this {
    const public_key
      = typeof key === 'string' ? key
        : (key instanceof PublicKey ? key.toString()
          : key.getPublicKey().toString());
    return this.push({
      AccessKey: {
        account_id: this.account_id,
        public_key,
        access_key,
      },
    });
  }

  account(accountData?: Partial<AccountData>): this {
    const account = {...DEFAULT_ACCOUNT_DATA, ...accountData};
    return this.push({
      Account: {
        account_id: this.account_id,
        account,
      },
    });
  }

  data(data_key: string, value: string): this {
    return this.push({
      Data: {account_id: this.account_id, data_key, value},
    });
  }

  contract(binary: Buffer | string): this {
    const code
      = typeof binary === 'string' ? binary : binary.toString('base64');

    return this.push({
      Contract: {
        account_id: this.account_id,
        code,
      },
    });
  }
}
