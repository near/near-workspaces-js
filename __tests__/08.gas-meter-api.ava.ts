/**
 * This test file is a copy of '01.basic-transactions.ava.ts' with the addition
 * of a gas meter. The gas meter is used to track the amount of gas consumed.
 *
 * Note that the same tests will be run on both a local sandbox environment and
 * on testnet by using the `test:sandbox` and `test:testnet` scripts in
 * package.json.
 */
import {Worker, NEAR, NearAccount, GasMeter, Gas} from 'near-workspaces';
import anyTest, {TestFn} from 'ava';

const test = anyTest as TestFn<{
  worker: Worker;
  meter: GasMeter;
  accounts: Record<string, NearAccount>;
}>;

test.beforeEach(async t => {
  // Init the worker and start a Sandbox server
  const meter = new GasMeter();
  const worker = await Worker.init({tx_callbacks: [meter.tx_callback()]});

  // Prepare sandbox for tests, create accounts, deploy contracts, etx.
  const root = worker.rootAccount;
  const contract = await root.devDeploy(
    '__tests__/build/debug/status_message.wasm',
    {initialBalance: NEAR.parse('3 N').toJSON()},
  );
  const ali = await root.createSubAccount('ali', {initialBalance: NEAR.parse('3 N').toJSON()});

  // Assert some gas was burnt on account creation
  t.notDeepEqual(meter.elapsed, Gas.from(0), `meter.elapsed: ${meter.elapsed.toString()}`);

  // Reset the meter
  meter.reset();

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
  t.deepEqual(t.context.meter.elapsed, Gas.from(0), 'no gas consumed for this view call');
});

test('Ali sets then gets status', async t => {
  const {ali, contract} = t.context.accounts;
  await ali.call(contract, 'set_status', {message: 'hello'});
  const result: string = await contract.view('get_status', {account_id: ali});
  t.is(result, 'hello');
  t.notDeepEqual(t.context.meter.elapsed, Gas.from(0)); // Amount of gas consumed > 0
});

test('Root and Ali have different statuses', async t => {
  const {root, contract, ali} = t.context.accounts;
  await root.call(contract, 'set_status', {message: 'world'});
  const rootStatus: string = await contract.view('get_status', {account_id: root});
  t.is(rootStatus, 'world');
  const aliStatus: null = await contract.view('get_status', {account_id: ali});
  t.is(aliStatus, null);
  t.notDeepEqual(t.context.meter.elapsed, Gas.from(0)); // Amount of gas consumed > 0
});
