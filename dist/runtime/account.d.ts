/// <reference types="node" />
import { URL } from 'url';
import { Buffer } from 'buffer';
import BN from 'bn.js';
import * as nearAPI from 'near-api-js';
import { AccessKey, KeyPair, PublicKey } from '../types';
import { FinalExecutionOutcome } from '../provider';
import { Runtime } from './runtime';
declare type Args = Record<string, any>;
export interface CallOptions {
    gas?: string | BN;
    attachedDeposit?: string | BN;
    signWithKey?: KeyPair;
}
export interface AccountBalance {
    total: string;
    stateStaked: string;
    staked: string;
    available: string;
}
export declare class Account {
    private readonly _accountId;
    private readonly runtime;
    private readonly levelUp?;
    constructor(_accountId: string, runtime: Runtime, levelUp?: string | undefined);
    get najAccount(): nearAPI.Account;
    get connection(): nearAPI.Connection;
    get networkId(): string;
    get signer(): nearAPI.InMemorySigner;
    get keyStore(): nearAPI.keyStores.KeyStore;
    get accountId(): string;
    get prefix(): string;
    balance(): Promise<AccountBalance>;
    createTransaction(receiver: Account | string): Transaction;
    get provider(): nearAPI.providers.JsonRpcProvider;
    getKey(accountId: string): Promise<KeyPair>;
    setKey(accountId: string, keyPair: KeyPair): Promise<void>;
    createAccount(accountId: string, { keyPair, initialBalance }?: {
        keyPair?: KeyPair;
        initialBalance?: string;
    }): Promise<Account>;
    /** Adds suffix to accountId if account isn't sub account or have full including top level account */
    getAccount(accountId: string): Account;
    createAndDeploy(accountId: string, wasm: string | URL | Uint8Array | Buffer, { attachedDeposit, args, gas, initialBalance, keyPair, method, }?: {
        args?: Record<string, unknown> | Uint8Array;
        attachedDeposit?: string | BN;
        gas?: string | BN;
        initialBalance?: BN | string;
        keyPair?: KeyPair;
        method?: string;
    }): Promise<Account>;
    /**
     * Call a NEAR contract and return full results with raw receipts, etc. Example:
     *
     *     await call('lol.testnet', 'set_status', { message: 'hello' }, new BN(30 * 10**12), '0')
     *
     * @returns nearAPI.providers.FinalExecutionOutcome
     */
    call_raw(contractId: Account | string, methodName: string, args: Record<string, unknown>, { gas, attachedDeposit, signWithKey, }?: {
        gas?: string | BN;
        attachedDeposit?: string | BN;
        signWithKey?: KeyPair;
    }): Promise<FinalExecutionOutcome>;
    /**
     * Convenient wrapper around lower-level `call_raw` that returns only successful result of call, or throws error encountered during call.  Example:
     *
     *     await call('lol.testnet', 'set_status', { message: 'hello' }, new BN(30 * 10**12), '0')
     *
     * @returns any parsed return value, or throws with an error if call failed
     */
    call(contractId: Account | string, methodName: string, args: Record<string, unknown>, { gas, attachedDeposit, signWithKey, }?: {
        gas?: string | BN;
        attachedDeposit?: string | BN;
        signWithKey?: KeyPair;
    }): Promise<any>;
    view_raw(method: string, args?: Args): Promise<nearAPI.providers.CodeResult>;
    view(method: string, args?: Args): Promise<any>;
    viewState(): Promise<ContractState>;
    patchState(key: string, value_: any, borshSchema?: any): Promise<any>;
    makeSubAccount(accountId: string): string;
    subAccountOf(accountId: string): boolean;
    protected addKey(accountId: string, keyPair?: KeyPair): Promise<PublicKey>;
    protected internalCreateAccount(accountId: string, { keyPair, initialBalance }?: {
        keyPair?: KeyPair;
        initialBalance?: string | BN;
    }): Promise<Transaction>;
}
export declare class ContractState {
    private readonly data;
    constructor(dataArray: Array<{
        key: Buffer;
        value: Buffer;
    }>);
    get_raw(key: string): Buffer;
    get(key: string, borshSchema?: {
        type: any;
        schema: any;
    }): any;
}
export declare class Transaction {
    protected sender: Account;
    protected receiverId: string;
    private readonly actions;
    constructor(sender: Account, receiver: Account | string);
    addKey(publicKey: string | PublicKey, accessKey?: AccessKey): this;
    createAccount(): this;
    deleteAccount(beneficiaryId: string): this;
    deleteKey(publicKey: string | PublicKey): this;
    deployContractFile(code: string | URL | Uint8Array | Buffer): Promise<Transaction>;
    deployContract(code: Uint8Array | Buffer): this;
    functionCall(methodName: string, args: Record<string, unknown> | Uint8Array, { gas, attachedDeposit, }: {
        gas: BN | string;
        attachedDeposit: BN | string;
    }): this;
    stake(amount: BN | string, publicKey: PublicKey | string): this;
    transfer(amount: string | BN): this;
    /**
     *
     * @param keyPair Temporary key to sign transaction
     * @returns
     */
    signAndSend(keyPair?: KeyPair): Promise<FinalExecutionOutcome>;
}
export declare class RuntimeTransaction extends Transaction {
    private readonly runtime;
    constructor(runtime: Runtime, sender: Account, receiver: Account | string);
    createAccount(): this;
    signAndSend(keyPair?: KeyPair): Promise<FinalExecutionOutcome>;
}
export {};
