import {AccountManager, TestnetManager} from '../src/account/account-manager';
import {TestnetRuntime, Runner, BN} from '../src';

jest.setTimeout(500_000);

describe('Account Manager', () => {
  if (!Runner.networkIsTestnet()) {
    test('skipping on ' + Runner.getNetworkFromEnv(), () => {});
    return;
  }

  test('should create a new account', async () => {
    const accountManager = await AccountManager.create(TestnetRuntime.defaultConfig);
    const {root} = accountManager;
    expect(await root.exists()).toBe(true);
  });

  test('should be able to add funds', async () => {
    const accountManager = await AccountManager.create(TestnetRuntime.defaultConfig);
    const {root} = accountManager;
    const balance = await root.balance();
    await (accountManager as TestnetManager).addFunds();
    const newBalance = await root.balance();
    expect(new BN(balance.available).lt(new BN(newBalance.available))).toBe(true);
  });
});
