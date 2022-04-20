"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Worker = void 0;
const container_1 = require("./container");
const internal_utils_1 = require("./internal-utils");
/**
 * The main interface to near-workspaces. Create a new worker instance with {@link Worker.init}, then run code using {@link Worker.fork}.
 *
 * @example
 * // Run multiple routines on testnet simultaneously
 * const worker = Worker.init({
 *   network: 'testnet', // Can also set the network using the NEAR_WORKSPACES_NETWORK environment variable
 *   rootAccount: 'me.testnet',
 * });
 * await Promise.all([
 *   worker.fork(async ({root}) => {
 *     await root.call('some-contract.testnet', 'some_method', { a: 1, b: 2 });
 *   }),
 *   worker.fork(async ({root}) => {
 *     await root.call('some-other-contract.testnet', 'some_method', { a: 2, b: 3 });
 *   }),
 * ]);
 *
 *
 * @example
 * const {Worker, NEAR} from 'near-workspaces';
 * // Test contracts in local sandbox mode, creating initial state for each `worker.fork`
 * const worker = Worker.init(async ({root}) => {
 *   // Create a subaccount of `root`, such as `alice.dev-account-123456.testnet`
 *   const alice = root.createSubAccount('alice');
 *   // Create a subaccount of `root`, deploy a contract to it, and call a method on that contract
 *   const contract = root.createAndDeploy('contract-account-name', '../path/to/contract.wasm', {
 *     method: 'init',
 *     args: {owner_id: root}
 *   });
 *   // Everything in this Worker.init function will happen prior to each call of `worker.fork`
 *   await alice.call(contract, 'some_registration_method', {}, {
 *     attachedDeposit: NEAR.parse('50 milliNEAR')
 *   });
 *   // Accounts returned from `Worker.init` function will be available in `worker.fork` calls
 *   return {alice, contract};
 * });
 * worker.fork(async ({alice, contract, root}) => {
 *   await root.call(contract, 'some_change_method', {account_id: alice});
 *   console.log({
 *     valueForRoot: await contract.view('some_view_method', {account_id: root});
 *     valueForAlice: await contract.view('some_view_method', {account_id: alice});
 *   });
 * });
 * worker.fork(async ({alice, contract, root}) => {
 *   // This worker does not call `some_change_method`
 *   console.log({
 *     valueForRoot: await contract.view('some_view_method', {account_id: root});
 *     valueForAlice: await contract.view('some_view_method', {account_id: alice});
 *   });
 * });
 */
class Worker {
    constructor(workspaceContainer) {
        (0, internal_utils_1.debug)('Lifecycle.Worker.cuntructor', 'workspaceContainer:', workspaceContainer);
        this.container = workspaceContainer;
    }
    /**
     * Initialize a new worker. In local sandbox mode, this will:
     *
     *   - Create a new local blockchain
     *   - Create the root account for that blockchain, available as `root`:
     *         Worker.init(async => ({root}) => {...})
     *   - Execute any actions passed to the function
     *   - Shut down the newly created blockchain, but *save the data*
     *
     * In testnet mode, the same functionality is achieved via different means,
     * since all actions must occur on one blockchain instead of N.
     *
     * @param configOrFunction Either a configuration object or a function to run. Accounts returned from this function will be passed as arguments to subsequent `worker.fork` calls.
     * @param f If configOrFunction is a config object, this must be a function to run
     * @returns an instance of the Worker class, to be used as a starting point for forkd workspaces.
     */
    static async init(configOrFunction = async () => ({}), f) {
        (0, internal_utils_1.debug)('Lifecycle.Worker.init()', 'params:', configOrFunction, f);
        const { config, fn } = getConfigAndFn(configOrFunction, f);
        const workspaceContainer = await container_1.WorkspaceContainer.create(config, fn);
        return new Worker(workspaceContainer);
    }
    /**
     * Run code in the context of a worker initialized with `Worker.init`.
     * In local sandbox mode, each `worker.fork` will:
     *
     *   - start a new local blockchain
     *   - copy the state from the blockchain created in `Worker.init`
     *   - get access to the accounts created in `Worker.init` using the same variable names
     *   - keep all data isolated from other `worker.fork` calls, so they can be run concurrently
     *   - shut down at the end, forgetting all new data created
     *
     * In testnet mode, the same functionality is achieved via different means,
     * since all actions must occur on one blockchain instead of N blockchains.
     *
     * @param fn code to run; has access to `root` and other accounts returned from function passed to `Worker.init`. Example: `worker.fork(async ({root, alice, bob}) => {...})`
     */
    async fork(fn) {
        (0, internal_utils_1.debug)('Lifecycle.Worker.fork()', 'fn:', fn);
        const container = await this.container.createFrom();
        await container.fork(fn);
        return container;
    }
}
exports.Worker = Worker;
function getConfigAndFn(configOrFunction, f) {
    const type1 = typeof configOrFunction;
    const type2 = typeof f;
    if (type1 === 'function' && type2 === 'undefined') {
        // @ts-expect-error Type this|that not assignable to that
        return { config: {}, fn: configOrFunction };
    }
    if (type1 === 'object' && (type2 === 'function' || type2 === 'undefined')) {
        // @ts-expect-error Type this|that not assignable to that
        return { config: configOrFunction, fn: f };
    }
    throw new Error('Invalid arguments! '
        + 'Expected `(config, runFunction)` or just `(runFunction)`');
}
//# sourceMappingURL=workspace.js.map