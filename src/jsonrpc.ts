import {Buffer} from 'buffer';
import {NEAR} from 'near-units';
import {JsonRpcProvider, ContractCodeView, AccountView, NearProtocolConfig, AccountBalance, CodeResult, BlockId, Finality, ViewStateResult} from './types';
import {Records} from './contract-state';

export class JSONRpc extends JsonRpcProvider {
  private static readonly providers: Map<string, JSONRpc> = new Map();

  static from(config: string | {rpcAddr: string}): JSONRpc {
    const url = typeof config === 'string' ? config : config.rpcAddr;
    if (!this.providers.has(url)) {
      this.providers.set(url, new JSONRpc(url));
    }

    return this.providers.get(url)!;
  }

  async viewCode(account_id: string): Promise<Buffer> {
    const codeResponse: ContractCodeView = await this.query({
      request_type: 'view_code',
      finality: 'final',
      account_id,
    });
    return Buffer.from(codeResponse.code_base64, 'base64');
  }

  async viewAccount(account_id: string): Promise<AccountView> {
    return this.query<AccountView>({
      request_type: 'view_account',
      account_id,
      finality: 'optimistic',
    });
  }

  async accountExists(account_id: string): Promise<boolean> {
    try {
      await this.viewAccount(account_id);
      return true;
    } catch {
      return false;
    }
  }

  async protocolConfig(): Promise<NearProtocolConfig> {
    return this.experimental_protocolConfig({
      finality: 'final',
    });
  }

  async account_balance(account_id: string): Promise<AccountBalance> {
    const config = await this.protocolConfig();
    const state = await this.viewAccount(account_id);
    const cost = config.runtime_config.storage_amount_per_byte;
    const costPerByte = NEAR.from(cost);
    const stateStaked = NEAR.from(state.storage_usage).mul(costPerByte);
    const staked = NEAR.from(state.locked);
    const total = NEAR.from(state.amount).add(staked);
    const available = total.sub(staked.max(stateStaked));
    return {
      total,
      stateStaked,
      staked,
      available,
    };
  }

  async view_call(account_id: string, method_name: string, args: Record<string, unknown>): Promise<CodeResult> {
    return this.query({
      request_type: 'call_function',
      account_id,
      method_name,
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
      finality: 'optimistic',
    });
  }

  async viewState(account_id: string, prefix: string | Uint8Array, blockQuery?: {blockId: BlockId} | {finality: Finality}): Promise<Array<{key: Buffer; value: Buffer}>> {
    const {values} = await this.query<ViewStateResult>({
      request_type: 'view_state',
      ...(blockQuery ?? {finality: 'optimistic'}),
      account_id,
      prefix_base64: Buffer.from(prefix).toString('base64'),
    });

    return values.map(({key, value}) => ({
      key: Buffer.from(key, 'base64'),
      value: Buffer.from(value, 'base64'),
    }));
  }

  async sandbox_patch_state(records: Records): Promise<any> {
    return this.sendJsonRpc('sandbox_patch_state', records);
  }
}

