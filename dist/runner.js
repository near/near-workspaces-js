"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Runner = void 0;
const process_1 = __importDefault(require("process"));
const runtime_1 = require("./runtime");
class Runner {
    constructor(runtime) {
        this.runtime = runtime;
    }
    /** Create the initial enviorment for the test to run in.
     * For example create accounts and deploy contracts that future tests will use.
     */
    static async create(configOrFunction, f) {
        var _a;
        const { config, fn } = getConfigAndFn(configOrFunction, f);
        config.network = (_a = config.network) !== null && _a !== void 0 ? _a : this.getNetworkFromEnv();
        const runtime = await runtime_1.Runtime.create(config, fn);
        return new Runner(runtime);
    }
    static networkIsTestnet() {
        return this.getNetworkFromEnv() === 'testnet';
    }
    static networkIsSandbox() {
        return this.getNetworkFromEnv() === 'sandbox';
    }
    static getNetworkFromEnv() {
        const network = process_1.default.env.NEAR_RUNNER_NETWORK;
        switch (network) {
            case 'sandbox':
            case 'testnet':
                return network;
            case undefined:
                return 'sandbox';
            default:
                throw new Error(`environment variable NEAR_RUNNER_NETWORK=${network} invalid; `
                    + 'use \'testnet\' or \'sandbox\' (the default)');
        }
    }
    /**
     * Sets up the context, runs the function, and tears it down.
     * @param fn function to pass runtime to.
     * @returns the runtime used
     */
    async run(fn) {
        const runtime = await this.runtime.createFrom();
        await runtime.run(fn);
        return runtime;
    }
    /**
     * Only runs the function if the network is sandbox.
     * @param fn is the function to run
     * @returns
     */
    async runSandbox(fn) {
        if (this.runtime.config.network === 'sandbox') {
            return this.run(fn);
        }
        return null;
    }
}
exports.Runner = Runner;
function getConfigAndFn(configOrFunction, f) {
    const type1 = typeof configOrFunction;
    const type2 = typeof f;
    if (type1 === 'function' && type2 === 'undefined') {
        // @ts-expect-error Type this|that not assignable to that
        return { config: {}, fn: configOrFunction };
    }
    if (type1 === 'object' && type2 === 'function') {
        // @ts-expect-error Type this|that not assignable to that
        return { config: configOrFunction, fn: f };
    }
    throw new Error('Invalid arguments! '
        + 'Expected `(config, runFunction)` or just `(runFunction)`');
}
//# sourceMappingURL=runner.js.map