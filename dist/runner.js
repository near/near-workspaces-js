"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Runner = void 0;
const runtime_1 = require("./runtime");
class Runner {
    constructor(config) {
        this.config = config;
    }
    static async create(configOrFunction, f) {
        const { config, fn } = getConfigAndFn(configOrFunction, f);
        const runner = new Runner(config);
        const runtime = await runner.run(fn);
        return new Runner({
            ...config,
            init: false,
            refDir: runtime.config.homeDir
        });
    }
    async run(fn) {
        const runtime = await runtime_1.Runtime.create(this.config);
        await runtime.run(fn);
        return runtime;
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