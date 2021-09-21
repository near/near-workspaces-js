import {Buffer} from 'buffer';
import {NEAR} from 'near-units';
import {Records} from './record';
import {JSONRpc, ContractCodeView, AccountView, NearProtocolConfig, AccountBalance, CodeResult, ViewStateResult, BlockId, Finality, Empty} from './types';

/**
 * Extends the main provider class in NAJ, adding more methods for
 * interacting with an endpoint.
 */
export class JsonRpcProvider extends JSONRpc {
  private static readonly providers: Map<string, JsonRpcProvider> = new Map();

  /**
   *
   * @param config rpc endpoint URL or a configuration that includes one.
   * @returns
   */
  static from(config: string | {rpcAddr: string}): JsonRpcProvider {
    const url = typeof config === 'string' ? config : config.rpcAddr;
    if (!this.providers.has(url)) {
      this.providers.set(url, new JsonRpcProvider(url));
    }

    return this.providers.get(url)!;
  }

  /**
   * Download the binary of a given contract.
   * @param account_id contract account
   * @returns Buffer of Wasm binary
   */
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

  /**
   * Download the state of a contract given a prefix of a key.
   *
   * @param account_id contract account to lookup
   * @param prefix string or byte prefix of keys to loodup
   * @param blockQuery state at what block, defaults to most recent final block
   * @returns raw RPC response
   */
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

  /**
   * Updates records without using a transaction.
   * Note: only avaialable on Sandbox endpoints.
   * @param records
   * @returns
   */
  async sandbox_patch_state(records: Records): Promise<Empty> {
    return this.sendJsonRpc('sandbox_patch_state', records);
  }
}

