"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Runner = void 0;
const runtime_1 = require("./runtime");
class Runner {
    constructor(config) {
        this.config = config;
    }
    /** Create the initial enviorment for the test to run in.
     * For example create accounts and deploy contracts that future tests will use.
     */
    static async create(configOrFunction, f) {
        const { config, fn } = getConfigAndFn(configOrFunction, f);
        const runtime = await runtime_1.Runtime.create(config, fn);
        return new Runner({
            ...config,
            init: false,
            refDir: runtime.config.homeDir,
            initFn: fn
        });
    }
    /**
     * Sets up the context, runs the function, and tears it down.
     * @param fn function to pass runtime to.
     * @returns the runtime used
     */
    async run(fn) {
        const runtime = await runtime_1.Runtime.create(this.config);
        await runtime.run(fn);
        return runtime;
    }
    /**
     * Only runs the function if the network is sandbox.
     * @param fn is the function to run
     * @returns
     */
    async runSandbox(fn) {
        if (this.config.network == "sandbox") {
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
        // @ts-ignore Type this|that not assignable to that
        return { config: {}, fn: configOrFunction };
    }
    if (type1 === 'object' && type2 === 'function') {
        // @ts-ignore Type this|that not assignable to that
        return { config: configOrFunction, fn: f };
    }
    throw new Error("Invalid arguments!" +
        "Expected `(config, runFunction)` or just `(runFunction)`");
}
//# sourceMappingURL=runner.js.map