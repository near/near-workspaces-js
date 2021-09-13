/// <reference types="node" />
import { Buffer } from 'buffer';
import { NamedAccount } from '../types';
import { Account, AccountData, KeyData, StateRecord } from './types';
export declare class RecordBuilder {
    readonly records: StateRecord[];
    static fromAccount(accountId: string | Account): AccountBuilder;
    push(record: StateRecord): this;
}
export declare class AccountBuilder extends RecordBuilder {
    readonly account_id: string;
    constructor(accountOrId: string | Account | NamedAccount);
    accessKey(keyData: KeyData): this;
    account(accountData?: Partial<AccountData>): this;
    data(data_key: string, value: string): this;
    contract(binary: Buffer | string): this;
}
