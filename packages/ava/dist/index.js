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
/* eslint-disable ava/no-ignored-test-files */
const near_runner_1 = require("near-runner");
const ava_1 = __importDefault(require("ava")); // eslint-disable-line @typescript-eslint/no-duplicate-imports
exports.ava = ava_1.default;
__exportStar(require("near-runner"), exports);
class Runner extends near_runner_1.Runner {
    static create(configOrFunction, f) {
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