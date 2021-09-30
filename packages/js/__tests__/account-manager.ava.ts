import {ava as test} from 'near-runner-ava';
import {AccountManager, TestnetManager, TestnetRuntime, Runner} from '..';

if (Runner.networkIsTestnet()) {
  test('should create a new account', async t => {
    const accountManager = AccountManager.create(TestnetRuntime.defaultConfig);
    await accountManager.init();
    const {root} = accountManager;
    t.true(await root.exists());
  });

  test('should be able to add funds', async t => {
    const accountManager = AccountManager.create(TestnetRuntime.defaultConfig);
    await accountManager.init();
    const {root} = accountManager;
    const balance = await root.availableBalance();
    await (accountManager as TestnetManager).addFundsFromNetwork();
    const newBalance = await root.availableBalance();
    t.true(balance.lt(newBalance));
  });
} else {
  test('skipping on ' + Runner.getNetworkFromEnv(), t => {
    t.true(true);
  });
}
