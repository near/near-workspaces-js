"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Runner = exports.ava = void 0;
const near_runner_1 = require("near-runner");
const ava_1 = __importDefault(require("ava")); // eslint-disable-line @typescript-eslint/no-duplicate-imports
exports.ava = ava_1.default;
__exportStar(require("near-runner"), exports);
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
class Runner extends near_runner_1.Runner {
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
    static create(configOrFunction = async () => ({}), f) {
        const runner = near_runner_1.Runner.create(configOrFunction, f);
        runner.test = (description, fn) => {
            (0, ava_1.default)(description, async (t) => {
                await runner.run(async (args, runtime) => fn(t, args, runtime));
            });
        };
        return runner;
    }
}
exports.Runner = Runner;
//# sourceMappingURL=index.js.map