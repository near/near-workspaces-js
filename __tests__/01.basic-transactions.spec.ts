/**
 * This test demonstrates basic behavior of near-runner, making simple
 * function calls and view calls to the contract from
 * https://github.com/near-examples/rust-status-message
 *
 * Note that the same tests will be run on both a local sandbox environment and
 * on testnet by using the `test:sandbox` and `test:testnet` scripts in
 * package.json.
 */
import path from 'path';
import {Runner} from '../src';

describe(`Running on ${Runner.getNetworkFromEnv()}`, () => {
  const runner = Runner.create(async ({root}) => ({
    contract: await root.createAndDeploy(
      'status-message',
      path.join(__dirname, 'build', 'debug', 'status_message.wasm'),
    ),
    ali: await root.createAccount('ali'),
  }));

  test.concurrent('Root gets null status', async () => {
    await runner.run(async ({contract, root}) => {
      const result = await contract.view('get_status', {
        account_id: root,
      });
      expect(result).toBeNull();
    });
  });

  test.concurrent('Ali sets then gets status', async () => {
    await runner.run(async ({contract, ali}) => {
      await ali.call(contract, 'set_status', {message: 'hello'});
      const result: string = await contract.view('get_status', {
        account_id: ali,
      });
      expect(result).toBe('hello');
    });
  });

  test.concurrent('Root and Ali have different statuses', async () => {
    await runner.run(async ({contract, root, ali}) => {
      await root.call(contract, 'set_status', {message: 'world'});
      const rootStatus: string = await contract.view('get_status', {
        account_id: root,
      });
      expect(rootStatus).toBe('world');

      const aliStatus = await contract.view('get_status', {
        account_id: ali,
      });
      expect(aliStatus).toBeNull();
    });
  });
});
