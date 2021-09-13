"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountBuilder = exports.RecordBuilder = void 0;
class RecordBuilder {
    constructor() {
        this.records = [];
        // ToJSON(): string {
        //   return JSON.stringify({records: this.records});
        // }
    }
    static fromAccount(accountId) {
        return new AccountBuilder(accountId);
    }
    push(record) {
        this.records.push(record);
        return this;
    }
}
exports.RecordBuilder = RecordBuilder;
const DEFAULT_ACCOUNT_DATA = {
    // 10_000 NEAR
    amount: '10000000000000000000000000000',
    locked: '0',
    // No contract hash
    code_hash: '11111111111111111111111111111111',
    storage_usage: 0,
    version: 'V1',
};
class AccountBuilder extends RecordBuilder {
    constructor(accountOrId) {
        super();
        if (typeof accountOrId === 'string') {
            this.account_id = accountOrId;
        }
        else if ('Account' in accountOrId
            && typeof accountOrId.Account.account_id === 'string') {
            this.account_id = accountOrId.Account.account_id;
            this.push(accountOrId);
        }
        else if ('accountId' in accountOrId
            && typeof accountOrId.accountId === 'string') {
            this.account_id = accountOrId.accountId;
        }
        else {
            throw new TypeError('Only `strings` or `Record.Accounts` are not allowed.');
        }
    }
    accessKey(keyData) {
        return this.push({
            AccessKey: {
                account_id: this.account_id,
                ...keyData,
            },
        });
    }
    account(accountData) {
        const account = { ...DEFAULT_ACCOUNT_DATA, ...accountData };
        return this.push({
            Account: {
                account_id: this.account_id,
                account,
            },
        });
    }
    data(data_key, value) {
        return this.push({
            Data: { account_id: this.account_id, data_key, value },
        });
    }
    contract(binary) {
        const code = typeof binary === 'string' ? binary : binary.toString('base64');
        return this.push({
            Contract: {
                account_id: this.account_id,
                code,
            },
        });
    }
}
exports.AccountBuilder = AccountBuilder;
//# sourceMappingURL=builder.js.map