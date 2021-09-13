/// <reference types="node" />
import { URL } from 'url';
import { Buffer } from 'buffer';
import BN from 'bn.js';
import { NEAR } from 'near-units';
import { KeyPair, PublicKey, CodeResult, AccountBalance, Args, AccountView } from '../types';
import { Transaction } from '../transaction';
import { ContractState } from '../contract-state';
import { JsonRpcProvider } from '../jsonrpc';
import { TransactionResult } from '../transaction-result';
import { Records } from '../record';
import { NearAccount } from './near-account';
import { NearAccountManager } from './near-account-manager';
export declare class Account implements NearAccount {
    private readonly _accountId;
    private readonly manager;
    constructor(_accountId: string, manager: NearAccountManager);
    accountView(): Promise<AccountView>;
    exists(): Promise<boolean>;
    protected get provider(): JsonRpcProvider;
    get accountId(): string;
    availableBalance(): Promise<NEAR>;
    balance(): Promise<AccountBalance>;
    createTransaction(receiver: NearAccount | string): Transaction;
    getKey(): Promise<KeyPair | null>;
    setKey(keyPair?: KeyPair): Promise<PublicKey>;
    createAccount(accountId: string, { keyPair, initialBalance, }?: {
        keyPair?: KeyPair;
        initialBalance?: string;
    }): Promise<NearAccount>;
    getAccount(accountId: string): NearAccount;
    getFullAccount(accountId: string): NearAccount;
    createAndDeploy(accountId: string, wasm: string | URL | Uint8Array | Buffer, { attachedDeposit, args, gas, initialBalance, keyPair, method, }?: {
        args?: Record<string, unknown> | Uint8Array;
        attachedDeposit?: string | BN;
        gas?: string | BN;
        initialBalance?: BN | string;
        keyPair?: KeyPair;
        method?: string;
    }): Promise<NearAccount>;
    call_raw(contractId: NearAccount | string, methodName: string, args: Record<string, unknown> | Uint8Array, { gas, attachedDeposit, signWithKey, }?: {
        gas?: string | BN;
        attachedDeposit?: string | BN;
        signWithKey?: KeyPair;
    }): Promise<TransactionResult>;
    call<T>(contractId: NearAccount | string, methodName: string, args: Record<string, unknown> | Uint8Array, { gas, attachedDeposit, signWithKey, }?: {
        gas?: string | BN;
        attachedDeposit?: string | BN;
        signWithKey?: KeyPair;
    }): Promise<T | string>;
    view_raw(method: string, args?: Args): Promise<CodeResult>;
    view<T>(method: string, args?: Args): Promise<T | string>;
    viewCode(): Promise<Buffer>;
    viewState(prefix?: string | Uint8Array): Promise<ContractState>;
    patchState(key: string, value_: any, borshSchema?: any): Promise<any>;
    sandbox_patch_state(records: Records): Promise<any>;
    delete(beneficiaryId: string, keyPair?: KeyPair): Promise<TransactionResult>;
    makeSubAccount(accountId: string): string;
    subAccountOf(accountId: string): boolean;
    toJSON(): string;
    transfer(accountId: string | NearAccount, amount: string | BN): Promise<TransactionResult>;
    protected internalCreateAccount(accountId: string, { keyPair, initialBalance, }?: {
        keyPair?: KeyPair;
        initialBalance?: string | BN;
    }): Promise<Transaction>;
    private getOrCreateKey;
}
