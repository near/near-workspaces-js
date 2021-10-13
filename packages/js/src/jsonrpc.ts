// eslint-disable unicorn/no-object-as-default-parameter
import {Buffer} from 'buffer';
import {NEAR} from 'near-units';
import {Records} from './record';
import {JSONRpc, ContractCodeView, AccountView, NearProtocolConfig, AccountBalance, CodeResult, ViewStateResult, BlockId, Finality, StateItem, TESTNET_RPC_ADDR, Empty, MAINNET_RPC_ADDR, PublicKey, Network} from './types';

const OPTIMISTIC: {finality: 'optimistic'} = {finality: 'optimistic'};
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

  static fromNetwork(network: Network): JsonRpcProvider {
    switch (network) {
      case 'mainnet': return MainnetRpc;
      case 'testnet': return TestnetRpc;
      default: throw new TypeError('Invalid network only mainnet or testnet');
    }
  }

  /**
   * Download the binary of a given contract.
   * @param account_id contract account
   * @returns Buffer of Wasm binary
   */
  async viewCode(account_id: string, blockQuery?: {block_id: BlockId} | {finality: Finality}): Promise<Buffer> {
    return Buffer.from(await this.viewCodeRaw(account_id, blockQuery), 'base64');
  }

  /**
   * Download the binary of a given contract.
   * @param account_id contract account
   * @returns Base64 string of Wasm binary
   */
  async viewCodeRaw(account_id: string, blockQuery: {block_id: BlockId} | {finality: Finality} = OPTIMISTIC): Promise<string> {
    const {code_base64}: ContractCodeView = await this.query({
      request_type: 'view_code',
      account_id,
      ...blockQuery,
    });
    return code_base64;
  }

  async viewAccount(account_id: string, blockQuery: {block_id: BlockId} | {finality: Finality} = OPTIMISTIC): Promise<AccountView> {
    return this.query<AccountView>({
      request_type: 'view_account',
      account_id,
      ...blockQuery,
    });
  }

  async accountExists(account_id: string, blockQuery?: {block_id: BlockId} | {finality: Finality}): Promise<boolean> {
    try {
      await this.viewAccount(account_id, blockQuery);
      return true;
    } catch {
      return false;
    }
  }

  async view_access_key(account_id: string, publicKey: PublicKey | string, blockQuery: {block_id: BlockId} | {finality: Finality} = OPTIMISTIC): Promise<any> {
    return this.query({
      request_type: 'view_access_key',
      account_id,
      public_key: typeof publicKey === 'string' ? publicKey : publicKey.toString(),
      ...blockQuery,
    });
  }

  async protocolConfig(blockQuery: {block_id: BlockId} | {finality: Finality} = OPTIMISTIC): Promise<NearProtocolConfig> {
    // @ts-expect-error Bad type
    return this.experimental_protocolConfig(blockQuery);
  }

  async account_balance(account_id: string, blockQuery?: {block_id: BlockId} | {finality: Finality}): Promise<AccountBalance> {
    const config = await this.protocolConfig(blockQuery);
    const state = await this.viewAccount(account_id, blockQuery);
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

  async view_call(account_id: string, method_name: string, args: Record<string, unknown>, blockQuery?: {block_id: BlockId} | {finality: Finality}): Promise<CodeResult> {
    return this.view_call_raw(account_id, method_name, Buffer.from(JSON.stringify(args)).toString('base64'), blockQuery);
  }

  /**
   *
   * @param account_id
   * @param method_name
   * @param args Base64 encoded string
   * @param blockQuery
   * @returns
   */
  async view_call_raw(account_id: string, method_name: string, args_base64: string, blockQuery: {block_id: BlockId} | {finality: Finality} = OPTIMISTIC): Promise<CodeResult> {
    return this.query({
      request_type: 'call_function',
      account_id,
      method_name,
      args_base64,
      ...blockQuery,
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
  async viewState(account_id: string, prefix: string | Uint8Array, blockQuery?: {block_id: BlockId} | {finality: Finality}): Promise<Array<{key: Buffer; value: Buffer}>> {
    const values = await this.viewStateRaw(account_id, prefix, blockQuery);

    return values.map(({key, value}) => ({
      key: Buffer.from(key, 'base64'),
      value: Buffer.from(value, 'base64'),
    }));
  }

  /**
   * Download the state of a contract given a prefix of a key without decoding from base64.
   *
   * @param account_id contract account to lookup
   * @param prefix string or byte prefix of keys to loodup
   * @param blockQuery state at what block, defaults to most recent final block
   * @returns raw RPC response
   */
  async viewStateRaw(account_id: string, prefix: string | Uint8Array, blockQuery?: {block_id: BlockId} | {finality: Finality}): Promise<StateItem[]> {
    const {values} = await this.query<ViewStateResult>({
      request_type: 'view_state',
      ...(blockQuery ?? {finality: 'optimistic'}),
      account_id,
      prefix_base64: Buffer.from(prefix).toString('base64'),
    });

    return values;
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

export const TestnetRpc = JsonRpcProvider.from(TESTNET_RPC_ADDR);
export const MainnetRpc = JsonRpcProvider.from(MAINNET_RPC_ADDR);

