"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureBinary = exports.copyDir = exports.debug = exports.spawn = exports.asyncSpawn = exports.exists = exports.sandboxBinary = exports.rm = void 0;
const fs = __importStar(require("fs/promises"));
const util_1 = require("util");
const child_process_1 = require("child_process");
Object.defineProperty(exports, "spawn", { enumerable: true, get: function () { return child_process_1.spawn; } });
const promisify_child_process_1 = require("promisify-child-process");
const rimraf_1 = __importDefault(require("rimraf"));
// @ts-ignore
const getBinary_1 = __importDefault(require("near-sandbox/getBinary"));
const fs_extra_1 = __importDefault(require("fs-extra"));
exports.rm = util_1.promisify(rimraf_1.default);
const sandboxBinary = () => getBinary_1.default().binaryPath;
exports.sandboxBinary = sandboxBinary;
async function exists(d) {
    let file;
    try {
        file = await fs.open(d, 'r');
    }
    catch (e) {
        return false;
    }
    finally {
        await (file === null || file === void 0 ? void 0 : file.close());
    }
    return true;
}
exports.exists = exists;
async function asyncSpawn(...args) {
    debug(`Sandbox Binary found: ${exports.sandboxBinary()}`);
    return promisify_child_process_1.spawn(exports.sandboxBinary(), args, { encoding: 'utf8' });
}
exports.asyncSpawn = asyncSpawn;
async function install() {
    const runPath = require.resolve("near-sandbox/install");
    try {
        await promisify_child_process_1.spawn("node", [runPath]);
    }
    catch (e) {
        console.error(e);
        throw new Error("Failed to install binary");
    }
    return;
}
function debug(s, ...args) {
    if (process.env["NEAR_RUNNER_DEBUG"]) {
        console.error(s, ...args);
    }
}
exports.debug = debug;
exports.copyDir = util_1.promisify(fs_extra_1.default.copy);
async function ensureBinary() {
    const binPath = exports.sandboxBinary();
    if (!await exists(binPath)) {
        await install();
    }
}
exports.ensureBinary = ensureBinary;
//# sourceMappingURL=utils.js.map