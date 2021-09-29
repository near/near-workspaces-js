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
exports.findFile = exports.isPathLike = exports.ensureBinary = exports.copyDir = exports.txDebug = exports.debug = exports.spawn = exports.asyncSpawn = exports.exists = exports.sandboxBinary = exports.rm = void 0;
const process_1 = __importDefault(require("process"));
const path_1 = require("path");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const fs = __importStar(require("fs/promises"));
const util_1 = require("util");
const child_process_1 = require("child_process");
Object.defineProperty(exports, "spawn", { enumerable: true, get: function () { return child_process_1.spawn; } });
const url_1 = require("url");
const promisify_child_process_1 = require("promisify-child-process");
const rimraf_1 = __importDefault(require("rimraf"));
// @ts-expect-error no typings
const getBinary_1 = __importDefault(require("near-sandbox/getBinary"));
const fs_extra_1 = __importDefault(require("fs-extra"));
exports.rm = (0, util_1.promisify)(rimraf_1.default);
const sandboxBinary = () => (0, getBinary_1.default)().binaryPath; // eslint-disable-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
exports.sandboxBinary = sandboxBinary;
async function exists(d) {
    let file;
    try {
        file = await fs.open(d, 'r');
    }
    catch {
        return false;
    }
    finally {
        await (file === null || file === void 0 ? void 0 : file.close());
    }
    return true;
}
exports.exists = exists;
async function asyncSpawn(...args) {
    debug(`spawning \`${(0, exports.sandboxBinary)()} ${args.join(' ')}\``);
    return (0, promisify_child_process_1.spawn)((0, exports.sandboxBinary)(), args, { encoding: 'utf8' });
}
exports.asyncSpawn = asyncSpawn;
async function install() {
    const runPath = require.resolve('near-sandbox/install');
    try {
        debug(`spawning \`node ${runPath}\``);
        await (0, promisify_child_process_1.spawn)('node', [runPath]);
    }
    catch (error) {
        console.error(error);
        throw new Error('Failed to install binary');
    }
}
function debug(...args) {
    if (process_1.default.env.NEAR_RUNNER_DEBUG) {
        console.error(...args);
    }
}
exports.debug = debug;
function txDebug(tx) {
    if (process_1.default.env.NEAR_RUNNER_TXDEBUG) {
        console.error(tx);
    }
}
exports.txDebug = txDebug;
exports.copyDir = (0, util_1.promisify)(fs_extra_1.default.copy);
async function ensureBinary() {
    const binPath = (0, exports.sandboxBinary)();
    if (!await exists(binPath)) {
        debug(`binPath=${binPath} doesn't yet exist; installing`);
        await install();
    }
}
exports.ensureBinary = ensureBinary;
function isPathLike(something) {
    return typeof something === 'string' || something instanceof url_1.URL;
}
exports.isPathLike = isPathLike;
/**
 * Attempts to construct an absolute path to a file given a path relative to a
 * package.json. Searches through `module.paths` (Node's resolution search
 * paths) as described in https://stackoverflow.com/a/18721515/249801, then
 * falls back to using process.cwd() if still not found. Throws an acceptable
 * user-facing error if no file found.
 */
async function findFile(relativePath) {
    for (const modulePath of module.paths) {
        try {
            await (0, promises_1.access)(modulePath, fs_1.constants.F_OK); // eslint-disable-line no-await-in-loop
            const absolutePath = (0, path_1.join)((0, path_1.dirname)(modulePath), relativePath);
            await (0, promises_1.access)(absolutePath, fs_1.constants.F_OK); // eslint-disable-line no-await-in-loop
            return absolutePath;
        }
        catch { }
    }
    const cwd = process_1.default.cwd();
    const absolutePath = (0, path_1.join)(cwd, relativePath);
    try {
        await (0, promises_1.access)(absolutePath, fs_1.constants.F_OK);
        return absolutePath;
    }
    catch { }
    throw new Error(`Could not find '${relativePath}' relative to any package.json file or your current working directory (${cwd})`);
}
exports.findFile = findFile;
//# sourceMappingURL=internal-utils.js.map