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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKeyFromFile = exports.callsites = exports.findCallerFile = void 0;
const fs = __importStar(require("fs/promises"));
const path_1 = require("path");
const utils_1 = require("../utils");
const types_1 = require("../types");
function findCallerFile() {
    const sites = callsites();
    const files = sites.filter(s => s.getFileName()).map(s => s.getFileName());
    const thisDir = __dirname;
    const parentDir = path_1.dirname(__dirname);
    utils_1.debug(`looking through ${files.join(', ')}, thisDir: ${thisDir}, parentDir:${parentDir}`);
    const i = files.findIndex(file => !file.startsWith(parentDir));
    return files[i];
}
exports.findCallerFile = findCallerFile;
function callsites() {
    const _prepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    const stack = new Error().stack.slice(1); // eslint-disable-line unicorn/error-message
    Error.prepareStackTrace = _prepareStackTrace;
    return stack;
}
exports.callsites = callsites;
async function getKeyFromFile(filePath, create = true) {
    var _a;
    try {
        const keyFile = require(filePath); // eslint-disable-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
        return types_1.KeyPair.fromString(
        // @ts-expect-error `x` does not exist on KeyFile
        (_a = keyFile.secret_key) !== null && _a !== void 0 ? _a : keyFile.private_key);
    }
    catch (error) {
        if (!create) {
            throw error;
        }
        utils_1.debug('about to write to ', filePath);
        const keyPair = types_1.KeyPairEd25519.fromRandom();
        await fs.writeFile(filePath, JSON.stringify({
            secret_key: keyPair.toString(),
        }));
        utils_1.debug('wrote to file ', filePath);
        return keyPair;
    }
}
exports.getKeyFromFile = getKeyFromFile;
//# sourceMappingURL=utils.js.map