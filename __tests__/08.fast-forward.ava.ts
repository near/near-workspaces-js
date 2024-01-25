import {NearAccount, getNetworkFromEnv} from 'near-workspaces';
import anyTest, {TestFn} from 'ava';
import {Worker} from 'near-workspaces/dist/worker';

// The contract provided contains only one view call, returning the
// block_timestamp and epoch_height of the current block as a tuple.
// Source is here <https://github.com/near/near-workspaces-rs/blob/main/examples/simple-contract/src/lib.rs>
const contract_wasm = '__tests__/build/debug/simple_contract.wasm';

// Represents the timestamp and epoch_height result from the view call.
type EnvData = [number, number];

if (getNetworkFromEnv() === 'sandbox') {
  const test = anyTest as TestFn<{
    worker: Worker;
    contract: NearAccount;
  }>;

  test.beforeEach(async t => {
    const worker = await Worker.init();
    const root = worker.rootAccount;
    const contract = await root.devDeploy(contract_wasm);

    t.context.worker = worker;
    t.context.contract = contract;
  });

  test.afterEach.always(async t => {
    await t.context.worker.tearDown().catch(error => {
      console.log('Failed to tear down the worker:', error);
    });
  });

  test('Fast Forward', async t => {
    const before = await t.context.contract.view('current_env_data');
    const env_before = before as EnvData;
    console.log(`Before: timestamp = ${env_before[0]}, epoch_height = ${env_before[1]}`);

    const forward_height = 10_000;

    // Call into fastForward. This will take a bit of time to invoke, but is
    // faster than manually waiting for the same amounts of blocks to be produced
    await t.context.worker.provider.fastForward(forward_height);

    const after = await t.context.contract.view('current_env_data');
    const env_after = after as EnvData;
    console.log(`After: timestamp = ${env_after[0]}, epoch_height = ${env_after[1]}`);

    const block = await t.context.worker.provider.block({finality: 'final'});

    // Rounding off to nearest hundred, providing wiggle room incase not perfectly `forward_height`
    t.true(Math.ceil(block.header.height / 100) * 100 === forward_height);
  });
}
