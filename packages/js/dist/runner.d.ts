import { Runtime } from './runtime';
import { Config, RunnerFn, CreateRunnerFn } from './interfaces';
/**
 * The main interface to near-runner. Create a new runner instance with {@link Runner.create}, then run code using {@link Runner.run}.
 *
 * @example
 * // Run multiple routines on testnet simultaneously
 * const runner = Runner.create({ network: 'testnet' }); // Can also set the network using the NEAR_RUNNER_NETWORK environment variable
 * await Promise.all([
 *   runner.run(async ({root}) => {
 *     await root.call('some-contract.testnet', 'some_method', { a: 1, b: 2 });
 *   }),
 *   runner.run(async ({root}) => {
 *     await root.call('some-other-contract.testnet', 'some_method', { a: 2, b: 3 })
 *   }),
 * ]);
 *
 * @example
 * const {Runner, NEAR} from 'near-runner';
 * // Test contracts in local sandbox mode, creating starting state for each `runner.run`
 * const runner = Runner.create(async ({root}) => {
 *   // Create a subaccount of `root`, such as `alice.dev-account-123456.testnet`
 *   const alice = root.createAccount('alice');
 *   // Create a subaccount of `root`, deploy a contract to it, and call a method on that contract
 *   const contract = root.createAndDeploy('contract-account-name', '../path/to/contract.wasm', {
 *     method: 'init',
 *     args: {owner_id: root}
 *   });
 *   // Everything in this Runner.create function will happen prior to each call of `runner.run`
 *   await alice.call(contract, 'some_registration_method', {}, {
 *     attachedDeposit: NEAR.parse('50 milliNEAR')
 *   });
 *   // Accounts returned from `Runner.create` function will be available in `runner.run` calls
 *   return {alice, contract};
 * });
 * runner.run(async ({alice, contract, root}) => {
 *   await root.call(contract, 'some_change_method', {account_id: alice});
 *   console.log({
 *     valueForRoot: await contract.view('some_view_method', {account_id: root});
 *     valueForAlice: await contract.view('some_view_method', {account_id: alice});
 *   });
 * });
 * runner.run(async ({alice, contract, root}) => {
 *   // This run does not call `some_change_method`
 *   console.log({
 *     valueForRoot: await contract.view('some_view_method', {account_id: root});
 *     valueForAlice: await contract.view('some_view_method', {account_id: alice});
 *   });
 * });
 */
export declare class Runner {
    private runtime?;
    private readonly ready;
    protected constructor(runtimePromise: Promise<Runtime>);
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
     * since all actions must occur on one blockchain instead of N.
     *
     * @param configOrFunction Either a configuration object or a function to run. Accounts returned from this function will be passed as arguments to subsequent `runner.test` calls.
     * @param f If configOrFunction is a config object, this must be a function to run
     * @returns an instance of the Runner class, which is used to run tests.
     */
    static create(configOrFunction?: CreateRunnerFn | Partial<Config>, f?: CreateRunnerFn): Runner;
    static networkIsTestnet(): boolean;
    static networkIsSandbox(): boolean;
    static getNetworkFromEnv(): 'sandbox' | 'testnet';
    /**
     *
     * Sets up a connection to a network and executes the provided function.
     * Unlike `run`, this will run the function once and not clean up after itself.
     * A rootAccount is required and if on testnet, will try to create account if it doesn't exist.
     * It also defaults to use your home directory's key store.
     *
     * @param config Config with the rootAccount argument required.
     * @param fn Function to run when connected.
     */
    static open(config: Partial<Config> & {
        rootAccount: string;
    }, fn: RunnerFn): Promise<void>;
    startWaiting(runtime: Promise<Runtime>): Promise<void>;
    /**
     * Run code in the context of a runner initialized with `Runner.create`.
     * In local sandbox mode, each `runner.run` will:
     *
     *   - start a new local blockchain
     *   - copy the state from the blockchain created in `Runner.create`
     *   - get access to the accounts created in `Runner.create` using the same variable names
     *   - keep all data isolated from other `runner.run` calls, so they can be run concurrently
     *   - shut down at the end, forgetting all new data created
     *
     * In testnet mode, the same functionality is achieved via different means,
     * since all actions must occur on one blockchain instead of N blockchains.
     *
     * @param fn code to run; has access to `root` and other accounts returned from function passed to `Runner.create`. Example: `runner.run(async ({root, alice, bob}) => {...})`
     */
    run(fn: RunnerFn): Promise<Runtime>;
    /**
     * Like `run`, but only runs when in local sandbox mode, not on testnet or mainnet. See docs for `run` for more info.
     *
     * @param fn code to run; has access to `root` and other accounts returned from function passed to `Runner.create`. Example: `runner.run(async ({root, alice, bob}) => {...})`
     */
    runSandbox(fn: RunnerFn): Promise<Runtime | null>;
}
//# sourceMappingURL=runner.d.ts.map