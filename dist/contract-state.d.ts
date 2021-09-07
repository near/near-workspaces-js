/// <reference types="node" />
import { Buffer } from 'buffer';
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
export interface Data {
    Data: {
        account_id: string;
        data_key: string;
        value: string;
    };
}
export declare type RecordType = Data;
export interface Records {
    records: RecordType[];
}
