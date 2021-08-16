/// <reference types="node" />
import BN from "bn.js";
import * as nearAPI from "near-api-js";
import { AccessKey, KeyPair, PublicKey } from "../types";
import { FinalExecutionOutcome } from "../provider";
declare type Args = {
    [key: string]: any;
};
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
    najAccount: nearAPI.Account;
    constructor(najAccount: nearAPI.Account);
    get connection(): nearAPI.Connection;
    get networkId(): string;
    get signer(): nearAPI.InMemorySigner;
    get keyStore(): nearAPI.keyStores.KeyStore;
    get accountId(): string;
    balance(): Promise<AccountBalance>;
    createTransaction(receiver: Account | string): Transaction;
    get provider(): nearAPI.providers.JsonRpcProvider;
    getKey(accountId: string): Promise<KeyPair>;
    setKey(accountId: string, keyPair: KeyPair): Promise<void>;
    addKey(accountId: string, keyPair?: KeyPair): Promise<PublicKey>;
    createAccount(accountId: string, { keyPair, initialBalance }: {
        keyPair?: KeyPair;
        initialBalance: string;
    }): Promise<Account>;
    createAndDeployContract(accountId: string, publicKey: string | PublicKey, code: Uint8Array, amount: BN, { method, args, gas, attachedDeposit, }: {
        method?: string;
        args?: object | Uint8Array;
        gas?: string | BN;
        attachedDeposit?: string | BN;
    }): Promise<Account>;
    /**
     * Call a NEAR contract and return full results with raw receipts, etc. Example:
     *
     *     await call('lol.testnet', 'set_status', { message: 'hello' }, new BN(30 * 10**12), '0')
     *
     * @returns nearAPI.providers.FinalExecutionOutcome
     */
    call_raw(contractId: Account | string, methodName: string, args: object, { gas, attachedDeposit, signWithKey, }?: {
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
    call(contractId: Account | string, methodName: string, args: object, { gas, attachedDeposit, signWithKey, }?: {
        gas?: string | BN;
        attachedDeposit?: string | BN;
        signWithKey?: KeyPair;
    }): Promise<any>;
    view_raw(method: string, args?: Args): Promise<any>;
    view(method: string, args?: Args): Promise<any>;
    viewState(): Promise<ContractState>;
    patchState(key: string, val: any, borshSchema?: any): Promise<any>;
    makeSubAccount(prefix: string): string;
}
export declare class ContractState {
    private data;
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
    private sender;
    private actions;
    private receiverId;
    constructor(sender: Account, receiver: Account | string);
    addKey(publicKey: string | PublicKey, accessKey?: AccessKey): Transaction;
    createAccount(): Transaction;
    deleteAccount(beneficiaryId: string): Transaction;
    deleteKey(publicKey: string | PublicKey): Transaction;
    deployContract(code: Uint8Array): Transaction;
    functionCall(methodName: string, args: object | Uint8Array, { gas, attachedDeposit, }: {
        gas: BN | string;
        attachedDeposit: BN | string;
    }): Transaction;
    stake(amount: BN | string, publicKey: PublicKey | string): Transaction;
    transfer(amount: string | BN): Transaction;
    /**
     *
     * @param keyPair Temporary key to sign transaction
     * @returns
     */
    signAndSend(keyPair?: KeyPair): Promise<FinalExecutionOutcome>;
}
export {};
