/// <reference types="node" />
/// <reference types="node" />
import { type URL } from 'url';
import { Buffer } from 'buffer';
import { type KeyPair, type PublicKey, type CodeResult, type AccountBalance, type Args, type AccountView, type Empty, type StateItem, type AccessKeyView, type AccessKeyList } from '../types';
import { type Transaction } from '../transaction';
import { ContractState } from '../contract-state';
import { JsonRpcProvider } from '../jsonrpc';
import { type TransactionResult } from '../transaction-result';
import { type AccessKeyData, type AccountData, type Records } from '../record';
import { type NearAccount } from './near-account';
import { type NearAccountManager } from './near-account-manager';
export declare class Account implements NearAccount {
    private readonly _accountId;
    private readonly manager;
    constructor(_accountId: string, manager: NearAccountManager);
    accountView(): Promise<AccountView>;
    exists(): Promise<boolean>;
    protected get provider(): JsonRpcProvider;
    get accountId(): string;
    availableBalance(): Promise<bigint>;
    balance(): Promise<AccountBalance>;
    batch(receiver: NearAccount | string): Transaction;
    getKey(): Promise<KeyPair | null>;
    setKey(keyPair?: KeyPair): Promise<PublicKey>;
    createAccount(accountId: string, { keyPair, initialBalance, }?: {
        keyPair?: KeyPair;
        initialBalance?: bigint;
        isSubAccount?: boolean;
    }): Promise<NearAccount>;
    createSubAccount(accountId: string, { keyPair, initialBalance, }?: {
        keyPair?: KeyPair;
        initialBalance?: bigint;
        isSubAccount?: boolean;
    }): Promise<NearAccount>;
    importContract({ testnetContract, mainnetContract, withData, blockId, keyPair, initialBalance, }: {
        testnetContract?: string;
        mainnetContract?: string;
        withData?: boolean;
        keyPair?: KeyPair;
        initialBalance?: bigint;
        blockId?: number | string;
    }): Promise<NearAccount>;
    getSubAccount(accountId: string): NearAccount;
    getAccount(accountId: string): NearAccount;
    deploy(code: string | URL | Uint8Array | Buffer): Promise<TransactionResult>;
    devCreateAccount({ initialBalance, keyPair, }?: {
        initialBalance?: bigint;
        keyPair?: KeyPair;
    }): Promise<NearAccount>;
    devDeploy(wasm: string | URL | Uint8Array | Buffer, { attachedDeposit, args, gas, initialBalance, keyPair, method, isSubAccount, }?: {
        args?: Record<string, unknown> | Uint8Array;
        attachedDeposit?: bigint;
        gas?: bigint;
        initialBalance?: bigint;
        keyPair?: KeyPair;
        method?: string;
        isSubAccount?: boolean;
    }): Promise<NearAccount>;
    callRaw(contractId: NearAccount | string, methodName: string, args: Record<string, unknown> | Uint8Array, { gas, attachedDeposit, signWithKey, }?: {
        gas?: bigint;
        attachedDeposit?: bigint;
        signWithKey?: KeyPair;
    }): Promise<TransactionResult>;
    call<T>(contractId: NearAccount | string, methodName: string, args: Record<string, unknown> | Uint8Array, { gas, attachedDeposit, signWithKey, }?: {
        gas?: bigint;
        attachedDeposit?: bigint;
        signWithKey?: KeyPair;
    }): Promise<T>;
    viewRaw(method: string, args?: Args): Promise<CodeResult>;
    view<T>(method: string, args?: Args): Promise<T>;
    viewCode(): Promise<Buffer>;
    viewCodeRaw(): Promise<string>;
    viewState(prefix?: string | Uint8Array): Promise<ContractState>;
    viewStateRaw(prefix?: string | Uint8Array): Promise<StateItem[]>;
    viewAccessKey(accountId: string, publicKey: PublicKey | string): Promise<AccessKeyView>;
    viewAccessKeys(accountId: string): Promise<AccessKeyList>;
    patchState(key: string, value_: any, borshSchema?: any): Promise<Empty>;
    patchStateRecords(records: Records): Promise<Empty>;
    delete(beneficiaryId: string, keyPair?: KeyPair): Promise<TransactionResult>;
    makeSubAccount(accountId: string): string;
    subAccountOf(accountId: string): boolean;
    toJSON(): string;
    updateAccount(accountData?: Partial<AccountData>): Promise<Empty>;
    updateAccessKey(key: string | PublicKey | KeyPair, access_key_data?: AccessKeyData): Promise<Empty>;
    updateContract(binary: Buffer | string): Promise<Empty>;
    updateData(key: string | Buffer, value: string | Buffer): Promise<Empty>;
    transfer(accountId: string | NearAccount, amount: bigint): Promise<TransactionResult>;
    protected internalCreateAccount(accountId: string, { keyPair, initialBalance, isSubAccount, }?: {
        keyPair?: KeyPair;
        initialBalance?: bigint;
        isSubAccount?: boolean;
    }): Promise<Transaction>;
    private getOrCreateKey;
    private recordBuilder;
}
//# sourceMappingURL=account.d.ts.map