import process from 'process';

import test from 'ava';

import {JsonRpcProvider} from '..';

test('check url', t => {
  const provider = JsonRpcProvider.fromNetwork('mainnet');
  if (process.env.NEAR_CLI_MAINNET_RPC_SERVER_URL) {
    console.log('use rpc', process.env.NEAR_CLI_MAINNET_RPC_SERVER_URL);
    t.is(provider.connection.url, process.env.NEAR_CLI_MAINNET_RPC_SERVER_URL.toString());
  }
});
