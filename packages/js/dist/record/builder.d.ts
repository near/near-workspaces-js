/// <reference types="node" />
import { type Buffer } from 'buffer';
import { type KeyPair, type NamedAccount, PublicKey } from '../types';
import { type AccessKeyData, type Account, type AccountData, type StateRecord } from './types';
export declare class RecordBuilder {
    static fromAccount(accountId: string | Account | NamedAccount): AccountBuilder;
    readonly records: StateRecord[];
    push(record: StateRecord): this;
}
export declare class AccountBuilder extends RecordBuilder {
    readonly account_id: string;
    constructor(accountOrId: string | Account | NamedAccount);
    accessKey(key: string | PublicKey | KeyPair, access_key?: AccessKeyData): this;
    account(accountData?: Partial<AccountData>): this;
    data(data_key: string, value: string): this;
    contract(binary: Buffer | string): this;
}
//# sourceMappingURL=builder.d.ts.map