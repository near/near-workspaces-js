"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitize = exports.hashPathBase64 = exports.getKeyFromFile = exports.callsites = exports.findCallerFile = void 0;
const fs_1 = require("fs");
const buffer_1 = require("buffer");
const js_sha256_1 = __importDefault(require("js-sha256"));
const base64url_1 = __importDefault(require("base64url"));
const types_1 = require("../types");
function findCallerFile() {
    const sites = callsites();
    const files = sites.filter(s => s.getFileName());
    // Need better way to find file
    const i = files.length - 1;
    return [files[i].getFileName(), files[i].getLineNumber()];
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
        const keyPair = types_1.KeyPairEd25519.fromRandom();
        await fs_1.promises.writeFile(filePath, JSON.stringify({
            secret_key: keyPair.toString(),
        }));
        return keyPair;
    }
}
exports.getKeyFromFile = getKeyFromFile;
function hashPathBase64(s) {
    // Currently base64url is in newest version of node, but need to use polyfill for now
    const result = base64url_1.default.encode(buffer_1.Buffer.from(js_sha256_1.default.sha256.arrayBuffer(s)));
    return result;
}
exports.hashPathBase64 = hashPathBase64;
function sanitize(s) {
    return s.toLowerCase();
}
exports.sanitize = sanitize;
//# sourceMappingURL=utils.js.map