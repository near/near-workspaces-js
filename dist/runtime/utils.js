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
exports.isPathLike = exports.ensureBinary = exports.copyDir = exports.debug = exports.spawn = exports.asyncSpawn = exports.exists = exports.sandboxBinary = exports.rm = void 0;
const process_1 = __importDefault(require("process"));
const fs = __importStar(require("fs/promises"));
const util_1 = require("util");
const child_process_1 = require("child_process");
Object.defineProperty(exports, "spawn", { enumerable: true, get: function () { return child_process_1.spawn; } });
const url_1 = require("url"); // eslint-disable-line node/prefer-global/url
const promisify_child_process_1 = require("promisify-child-process");
const rimraf_1 = __importDefault(require("rimraf"));
// @ts-expect-error no typings
const getBinary_1 = __importDefault(require("near-sandbox/getBinary"));
const fs_extra_1 = __importDefault(require("fs-extra"));
exports.rm = util_1.promisify(rimraf_1.default);
const sandboxBinary = () => getBinary_1.default().binaryPath; // eslint-disable-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
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
    debug(`spawning \`${exports.sandboxBinary()} ${args.join(' ')}\``);
    return promisify_child_process_1.spawn(exports.sandboxBinary(), args, { encoding: 'utf8' });
}
exports.asyncSpawn = asyncSpawn;
async function install() {
    const runPath = require.resolve('near-sandbox/install'); // eslint-disable-line unicorn/prefer-module
    try {
        debug(`spawning \`node ${runPath}\``);
        await promisify_child_process_1.spawn('node', [runPath]);
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
exports.copyDir = util_1.promisify(fs_extra_1.default.copy);
async function ensureBinary() {
    const binPath = exports.sandboxBinary();
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
//# sourceMappingURL=utils.js.map