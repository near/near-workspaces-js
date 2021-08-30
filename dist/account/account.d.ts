/// <reference types="node" />
import { URL } from 'url';
import { Buffer } from 'buffer';
import BN from 'bn.js';
import { KeyPair, PublicKey, CodeResult, AccountBalance, Args } from '../types';
import { Transaction } from '../transaction';
import { ContractState } from '../contract-state';
import { JSONRpc } from '../jsonrpc';
import { TransactionResult } from '../transaction-result';
import { NearAccount } from './near-account';
import { NearAccountManager } from './near-account-manager';
export declare class Account implements NearAccount {
    private readonly _accountId;
    private readonly manager;
    constructor(_accountId: string, manager: NearAccountManager);
    exists(): Promise<boolean>;
    protected get provider(): JSONRpc;
    get accountId(): string;
    balance(): Promise<AccountBalance>;
    createTransaction(receiver: NearAccount | string): Transaction;
    getKey(): Promise<KeyPair | null>;
    setKey(keyPair?: KeyPair): Promise<PublicKey>;
    createAccount(accountId: string, { keyPair, initialBalance, }?: {
        keyPair?: KeyPair;
        initialBalance?: string;
    }): Promise<NearAccount>;
    getAccount(accountId: string): NearAccount;
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
    viewState(prefix?: string | Uint8Array): Promise<ContractState>;
    patchState(key: string, value_: any, borshSchema?: any): Promise<any>;
    delete(beneficiaryId: string): Promise<TransactionResult>;
    makeSubAccount(accountId: string): string;
    subAccountOf(accountId: string): boolean;
    toJSON(): string;
    protected internalCreateAccount(accountId: string, { keyPair, initialBalance, }?: {
        keyPair?: KeyPair;
        initialBalance?: string | BN;
    }): Promise<Transaction>;
}
