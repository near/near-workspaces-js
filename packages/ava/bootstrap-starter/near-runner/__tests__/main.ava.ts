import path from 'path';
import {Runner} from 'near-runner-ava';

// 'describe' is a global injected by Jest, and is optional.
describe('some set of behaviors', () => {
  const runner = Runner.create(async ({root}) => {
    const alice = await root.createAccount('alice');
    const contract = await root.createAndDeploy(
      'contract-account-name',
      path.join(__dirname, '..', '..', 'res', 'compiled.wasm'),
      {
        method: 'init_method',
        args: {owner_id: root},
      },
    );

    return {alice, contract};
  });

  // T is test execution context
  runner.test('behavior 1', async (t, {alice, contract}) => {
    // Don't forget to `await` your calls!
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

    // 'expect' is also injected by Jest
    t.is(result, 'whatever');
  });

  // All calls to `runner.test` run in parallel using `test.concurrent` from Jest
  runner.test('behavior 2', async (t, {alice, contract}) => {
    const result: string = await contract.view(
      'some_view_function',
      {account_id: alice},
    );
    t.is(result, 'some default');
  });
});

describe('some other set of behaviors', () => {
  const runner = Runner.create(async ({root}) => {
    // 'alice' and 'contract' are defined the same way as above...
    const alice = await root.createAccount('alice');
    const contract = await root.createAndDeploy(
      'contract-account-name',
      path.join(__dirname, '..', '..', 'res', 'compiled.wasm'),
      {
        method: 'init_method',
        args: {owner_id: root},
      },
    );

    // ...but this step is extra.
    await alice.call(contract, 'some_setup_function', {arg1: 'some value'});

    return {alice, contract};
  });

  // You can also use 'root' in your tests
  runner.test('behavior 3', async (t, {root, alice, contract}) => {
    t.log(root, alice, contract);
  });
});
