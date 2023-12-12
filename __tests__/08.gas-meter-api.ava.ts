/**
 * This test demonstrates the use of the gas meter API to meter the gas burnt
 * from transactions as seen by the worker.
 *
 * Note that the same tests will be run on both a local sandbox environment and
 * on testnet by using the `test:sandbox` and `test:testnet` scripts in
 * package.json.
 */
import {Worker, NEAR, NearAccount, GasMeter} from 'near-workspaces';
import anyTest, {TestFn} from 'ava';

const test = anyTest as TestFn<{
  worker: Worker;
  meter: GasMeter;
  accounts: Record<string, NearAccount>;
}>;

test.beforeEach(async t => {
  // Init the worker and start a Sandbox server
  const worker = await Worker.init();
  const meter = new GasMeter(worker);

  // Prepare sandbox for tests, create accounts, deploy contracts, etx.
  const root = worker.rootAccount;
  const contract = await root.devDeploy(
    '__tests__/build/debug/status_message.wasm',
    {initialBalance: NEAR.parse('3 N').toJSON()},
  );
  const ali = await root.createSubAccount('ali', {initialBalance: NEAR.parse('3 N').toJSON()});

  // Save state for test runs, it is unique for each test
  t.context.worker = worker;
  t.context.meter = meter;
  t.context.accounts = {root, contract, ali};
});

test.afterEach.always(async t => {
  // Reset the meter
  t.context.meter.reset();

  // Stop Sandbox server
  await t.context.worker.tearDown().catch(error => {
    console.log('Failed to tear down the worker:', error);
  });
});

test('Root gets null status', async t => {
  const {root, contract} = t.context.accounts;
  const result: null = await contract.view('get_status', {account_id: root.accountId});
  t.is(result, null);
  t.is(t.context.meter.elapsed, 0);
});

test('Ali sets then gets status', async t => {
  const {ali, contract} = t.context.accounts;
  await ali.call(contract, 'set_status', {message: 'hello'});
  const result: string = await contract.view('get_status', {account_id: ali});
  t.is(result, 'hello');
});

test('Root and Ali have different statuses', async t => {
  const {root, contract, ali} = t.context.accounts;
  await root.call(contract, 'set_status', {message: 'world'});
  const rootStatus: string = await contract.view('get_status', {account_id: root});
  t.is(rootStatus, 'world');
  const aliStatus: null = await contract.view('get_status', {account_id: ali});
  t.is(aliStatus, null);
});
