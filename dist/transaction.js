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
exports.Transaction = void 0;
const fs = __importStar(require("fs/promises"));
const types_1 = require("./types");
const utils_1 = require("./utils");
class Transaction {
    constructor(sender, receiver) {
        this.actions = [];
        this.senderId = typeof sender === 'string' ? sender : sender.accountId;
        this.receiverId = typeof receiver === 'string' ? receiver : receiver.accountId;
    }
    addKey(publicKey, accessKey = types_1.fullAccessKey()) {
        this.actions.push(types_1.addKey(types_1.PublicKey.from(publicKey), accessKey));
        return this;
    }
    createAccount() {
        this.actions.push(types_1.createAccount());
        return this;
    }
    deleteAccount(beneficiaryId) {
        this.actions.push(types_1.deleteAccount(beneficiaryId));
        return this;
    }
    deleteKey(publicKey) {
        this.actions.push(types_1.deleteKey(types_1.PublicKey.from(publicKey)));
        return this;
    }
    async deployContractFile(code) {
        return this.deployContract(utils_1.isPathLike(code) ? await fs.readFile(code) : code);
    }
    deployContract(code) {
        this.actions.push(types_1.deployContract(code));
        return this;
    }
    functionCall(methodName, args, { gas = types_1.DEFAULT_FUNCTION_CALL_GAS, attachedDeposit = types_1.NO_DEPOSIT, } = {}) {
        this.actions.push(types_1.functionCall(methodName, args, new types_1.BN(gas), new types_1.BN(attachedDeposit)));
        return this;
    }
    stake(amount, publicKey) {
        this.actions.push(types_1.stake(new types_1.BN(amount), types_1.PublicKey.from(publicKey)));
        return this;
    }
    transfer(amount) {
        this.actions.push(types_1.transfer(new types_1.BN(amount)));
        return this;
    }
}
exports.Transaction = Transaction;
//# sourceMappingURL=transaction.js.map