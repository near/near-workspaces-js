import {AccountManager, TestnetManager, TestnetRuntime, Runner} from '..';

jest.setTimeout(300_000);

describe('Account Manager', () => {
  if (!Runner.networkIsTestnet()) {
    test('skipping on ' + Runner.getNetworkFromEnv(), () => {});
    return;
  }

  test('should create a new account', async () => {
    const accountManager = AccountManager.create(TestnetRuntime.defaultConfig);
    await accountManager.init();
    const {root} = accountManager;
    expect(await root.exists()).toBe(true);
  });

  test('should be able to add funds', async () => {
    const accountManager = AccountManager.create(TestnetRuntime.defaultConfig);
    await accountManager.init();
    const {root} = accountManager;
    const balance = await root.availableBalance();
    await (accountManager as TestnetManager).addFundsFromNetwork();
    const newBalance = await root.availableBalance();
    expect(balance.lt(newBalance)).toBe(true);
  });
});
