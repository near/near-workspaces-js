import { CreateRunnerFn, Config, Runner as RawRunner, AccountArgs, NearRuntime } from 'near-runner';
import * as ava from 'ava';
import test from 'ava';
export * from 'near-runner';
export { test as ava };
export declare type AvaRunnerFn = (t: ava.ExecutionContext, args: AccountArgs, runtime: NearRuntime) => void | Promise<void>;
export declare interface Runner extends RawRunner {
    /**
     * Convenient wrapper around AVA's test function and near-runner's `runner.run`.
     * In local sandbox mode, each `runner.test` will:
     *
     *   - start a new local blockchain
     *   - copy the state from the blockchain created in `Runner.create`
     *   - get access to the accounts created in `Runner.create` using the same variable names
     *   - run concurrently with all other `runner.test` calls, keeping data isolated
     *   - shut down at the end, forgetting all new data created
     *
     * In testnet mode, the same functionality is achieved via different means,
     * since all actions must occur on one blockchain instead of N blockchains.
     *
     * It's also worth knowing that `runner.test` is syntax sugar added by
     * near-runner-ava. With raw AVA + near-runner, here's how to write a test:
     *
     *     import avaTest from 'ava';
     *     import {Runner} from 'near-runner';
     *     // Alternatively, you can import Runner and ava both from near-runner-ava:
     *     // import {ava as avaTest, Runner} from 'near-runner-ava';
     *
     *     const runner = Runner.create(...);
     *
     *     avaTest('some behavior', async test => {
     *       await runner.run(async ({root, ...}) => {
     *         ...
     *       });
     *     });
     *
     * Instead, with the syntax sugar, you can write this as you see it below –
     * saving an indentation level and avoiding one extra `await`.
     *
     * @param description title of test run by AVA, shown in test output
     * @param fn body of test
     */
    test(description: string, fn?: AvaRunnerFn): void;
}
/**
 * The main interface to near-runner-ava. Create a new runner instance with {@link Runner.create}, then run tests using {@link Runner.test}.
 *
 * @example
 * const {Runner, NEAR, Gas} from 'near-runner';
 * const runner = Runner.create(async ({root}) => {
 *   // Create a subaccount of `root`, such as `alice.sandbox` (get actual account ID with `alice.accountId`)
 *   const alice = root.createAccount('alice');
 *   // Create a subaccount of `root`, deploy a contract to it, and call a method on that contract
 *   const contract = root.createAndDeploy('contract-account-name', '../path/to/contract.wasm', {
 *     method: 'init',
 *     args: {owner_id: root}
 *   });
 *   // Everything in this Runner.create function will happen prior to each call of `runner.test`
 *   await alice.call(contract, 'some_registration_method', {}, {
 *     attachedDeposit: NEAR.parse('50 milliNEAR'),
 *     gas: Gas.parse('300Tgas'), // 300 Tgas is the max; 30 is the default
 *   });
 *   // Accounts returned from `Runner.create` function will be available in `runner.test` calls
 *   return {alice, contract};
 * });
 * runner.test(async (test, {alice, contract, root}) => {
 *   await root.call(contract, 'some_change_method', {account_id: alice});
 *   // the `test` object comes from AVA, and has test assertions and other helpers
 *   test.is(
 *     await contract.view('some_view_method', {account_id: root});
 *     await contract.view('some_view_method', {account_id: alice});
 *   });
 * });
 * runner.test(async (test, {alice, contract, root}) => {
 *   // This test does not call `some_change_method`
 *   test.not(
 *     await contract.view('some_view_method', {account_id: root});
 *     await contract.view('some_view_method', {account_id: alice});
 *   );
 * });
 */
export declare class Runner extends RawRunner {
    /**
     * Create a new runner. In local sandbox mode, this will:
     *
     *   - Create a new local blockchain
     *   - Create the root account for that blockchain, available as `root`:
     *         Runner.create(async => ({root}) => {...})
     *   - Execute any actions passed to the function
     *   - Shut down the newly created blockchain, but *save the data*
     *
     * In testnet mode, the same functionality is achieved via different means,
     * since all actions must occur on one blockchain instead of N blockchains.
     *
     * @param configOrFunction Either a configuration object or a function to run. Accounts returned from this function will be passed as arguments to subsequent `runner.test` calls.
     * @param f If configOrFunction is a config object, this must be a function to run
     * @returns an instance of the Runner class, which is used to run tests.
     */
    static create(configOrFunction?: CreateRunnerFn | Partial<Config>, f?: CreateRunnerFn): Runner;
}
//# sourceMappingURL=index.d.ts.map