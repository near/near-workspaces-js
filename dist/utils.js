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
exports.tGas = exports.createKeyPair = exports.toYocto = exports.ONE_NEAR = void 0;
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
function tGas(s) {
    return s + '0'.repeat(12);
}
exports.tGas = tGas;
//# sourceMappingURL=utils.js.map