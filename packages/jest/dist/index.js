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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Runner = void 0;
const near_runner_1 = require("near-runner");
__exportStar(require("near-runner"), exports);
class Runner extends near_runner_1.Runner {
    static create(configOrFunction, f) {
        const runner = near_runner_1.Runner.create(configOrFunction, f);
        runner.test = (description, fn) => {
            test.concurrent(description, async () => {
                await runner.run(fn);
            });
        };
        return runner;
    }
}
exports.Runner = Runner;
//# sourceMappingURL=index.js.map