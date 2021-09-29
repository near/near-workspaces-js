import {Runner} from 'near-runner-ava';

// Set up a `runner` with accounts, contracts, and state that will be used in all tests
const runner = Runner.create(async ({root}) => {
  const alice = await root.createAccount('alice');
  const contract = await root.createAndDeploy(
    'contract-account-name',
    'out/main.wasm', // Resolves relative to project root
    {
      method: 'init_method',
      args: {owner_id: root},
    },
  );

  // Don't forget to `await` your calls!
  await alice.call(contract, 'some_setup_function', {arg1: 'some value'});

  return {alice, contract};
});

// 'runner.test' is a shortcut added by near-runner-ava.
// Using raw near-runner and AVA, this would look like:
//
//     test('behavior 1', async t => {
//       await runner.run(async ({alice, contract}) => { … });
//     });
runner.test('behavior 1', async (t, {alice, contract}) => {
  await alice.call(
    contract,
    'some_update_function',
    {some_string_argument: 'cool', some_number_argument: 42},
  );

  // `await contract.view` returns an `any` type;
  // you can tell TypeScript that it's some other type, like `string`
  const result: string = await contract.view(
    'some_view_function',
    {account_id: alice},
  );

  // 't' comes from AVA: https://github.com/avajs/ava/blob/main/docs/03-assertions.md
  t.is(result, 'whatever');
});

// Tests run concurrently by default; disable if needed: https://github.com/avajs/ava/blob/main/docs/06-configuration.md
runner.test('behavior 2', async (t, {alice, contract}) => {
  const result: string = await contract.view(
    'some_view_function',
    {account_id: alice},
  );
  t.is(result, 'some default');
});

// You can also use 'root' in your tests
runner.test('behavior 3', async (t, {root, alice, contract}) => {
  // When --verbose CLI option is used, 't.log' will print neatly below test output
  t.log(root, alice, contract);
});
