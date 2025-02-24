/**
 * This test demonstrates basic behavior of near-workspaces, making simple
 * function calls and view calls to the contract from
 * https://github.com/near-examples/rust-status-message
 *
 * Note that the same tests will be run on both a local sandbox environment and
 * on testnet by using the `test:sandbox` and `test:testnet` scripts in
 * package.json.
 */
import {Worker, parseNEAR} from 'near-workspaces';
import test from 'ava';

test.beforeEach(async t => {
  // Init the worker and start a Sandbox server
  const worker = await Worker.init();

  // Prepare sandbox for tests, create accounts, deploy contracts, etx.
  const root = worker.rootAccount;
  const contract = await root.devDeploy(
      // source code: https://github.com/NEARFoundation/near-smart-contract-rust-template/tree/main
    'contracts/near_smart_contract_rust_template.wasm',
    {initialBalance: BigInt(parseNEAR('30'))},
  );
  const ali = await root.createSubAccount('ali', {initialBalance: BigInt(parseNEAR('3'))});

  // Save state for test runs, it is unique for each test
  t.context.worker = worker;
  t.context.accounts = {root, contract, ali};
});

test.afterEach.always(async t => {
  // Stop Sandbox server
  await t.context.worker.tearDown().catch(error => {
    console.log('Failed to tear down the worker:', error);
  });
});

test('Root call new', async t => {
  const {contract, ali} = t.context.accounts;
  await ali.call(contract, 'new', {});
});
