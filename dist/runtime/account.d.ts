/// <reference types="node" />
import BN from "bn.js";
import * as nearAPI from "near-api-js";
declare type Args = {
    [key: string]: any;
};
export declare class Account {
    najAccount: nearAPI.Account;
    constructor(account: nearAPI.Account);
    get connection(): nearAPI.Connection;
    get accountId(): string;
    get provider(): nearAPI.providers.JsonRpcProvider;
    /**
     * Call a NEAR contract and return full results with raw receipts, etc. Example:
     *
     *     await call('lol.testnet', 'set_status', { message: 'hello' }, new BN(30 * 10**12), '0')
     *
     * @returns nearAPI.providers.FinalExecutionOutcome
     */
    call_raw(contractId: ContractAccount | string, methodName: string, args: object, gas?: string | BN, attachedDeposit?: string | BN): Promise<any>;
    /**
     * Convenient wrapper around lower-level `call_raw` that returns only successful result of call, or throws error encountered during call.  Example:
     *
     *     await call('lol.testnet', 'set_status', { message: 'hello' }, new BN(30 * 10**12), '0')
     *
     * @returns any parsed return value, or throws with an error if call failed
     */
    call(contractId: ContractAccount | string, methodName: string, args: object, gas?: string | BN, // TODO: import DEFAULT_FUNCTION_CALL_GAS from NAJ
    attachedDeposit?: string | BN): Promise<any>;
}
export declare class ContractAccount extends Account {
    view_raw(method: string, args?: Args): Promise<any>;
    view(method: string, args?: Args): Promise<any>;
    viewState(): Promise<ContractState>;
    patchState(key: string, val: any, borshSchema?: any): Promise<any>;
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
export {};
