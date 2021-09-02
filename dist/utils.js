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
exports.isTopLevelAccount = exports.captureError = exports.NO_DEPOSIT = exports.asId = exports.randomAccountId = exports.tGas = exports.createKeyPair = exports.toYocto = exports.ONE_NEAR = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const nearAPI = __importStar(require("near-api-js"));
exports.ONE_NEAR = new bn_js_1.default('1' + '0'.repeat(24));
function toYocto(amount) {
    return nearAPI.utils.format.parseNearAmount(amount);
}
exports.toYocto = toYocto;
function createKeyPair() {
    return nearAPI.utils.KeyPairEd25519.fromRandom();
}
exports.createKeyPair = createKeyPair;
function tGas(x) {
    if (typeof x === 'string' && Number.isNaN(Number.parseInt(x, 10))) {
        throw new TypeError(`tGas expects a number or a number-like string; got: ${x}`);
    }
    return String(x) + '0'.repeat(12);
}
exports.tGas = tGas;
// Create random number with at least 7 digits by default
function randomAccountId(prefix = 'dev-', suffix = `-${(Math.floor(Math.random() * (9999999 - 1000000)) + 1000000)}`) {
    return `${prefix}${Date.now()}${suffix}`;
}
exports.randomAccountId = randomAccountId;
function asId(id) {
    return typeof id === 'string' ? id : id.accountId;
}
exports.asId = asId;
exports.NO_DEPOSIT = new bn_js_1.default('0');
async function captureError(fn) {
    try {
        await fn();
    }
    catch (error) {
        if (error instanceof Error) {
            return error.message;
        }
    }
    throw new Error('fn succeeded when expected to throw an exception');
}
exports.captureError = captureError;
function isTopLevelAccount(accountId) {
    return accountId.includes('.');
}
exports.isTopLevelAccount = isTopLevelAccount;
//# sourceMappingURL=utils.js.map