/// <reference types="node" />
import { Buffer } from 'buffer';
import { JsonRpcProvider, AccountView, NearProtocolConfig, AccountBalance, CodeResult, Records, BlockId, Finality } from '../types';
export declare class JSONRpc extends JsonRpcProvider {
    private static readonly providers;
    static from(config: string | {
        rpcAddr: string;
    }): JSONRpc;
    viewCode(account_id: string): Promise<Buffer>;
    viewAccount(account_id: string): Promise<AccountView>;
    accountExists(account_id: string): Promise<boolean>;
    protocolConfig(): Promise<NearProtocolConfig>;
    account_balance(account_id: string): Promise<AccountBalance>;
    view_call(account_id: string, method_name: string, args: Record<string, unknown>): Promise<CodeResult>;
    viewState(account_id: string, prefix: string | Uint8Array, blockQuery?: {
        blockId: BlockId;
    } | {
        finality: Finality;
    }): Promise<Array<{
        key: Buffer;
        value: Buffer;
    }>>;
    sandbox_patch_state(records: Records): Promise<any>;
}
