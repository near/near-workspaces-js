"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GasMeter = void 0;
const near_units_1 = require("near-units");
/**
 * A gas meter keeps track of the amount of gas seen by the worker.
 * The tx_callback should be added to the Worker on construction.
 */
class GasMeter {
    constructor() {
        this._elapsed = near_units_1.Gas.from(0);
        this._mutex = Promise.resolve();
    }
    tx_callback() {
        return async (burnt) => {
            await this._mutex;
            this._elapsed = near_units_1.Gas.from(this._elapsed.toNumber() + burnt.toNumber());
            this._mutex = Promise.resolve();
        };
    }
    get elapsed() {
        return this._elapsed;
    }
    async reset() {
        await this._mutex;
        this._elapsed = near_units_1.Gas.from(0);
        this._mutex = Promise.resolve();
    }
}
exports.GasMeter = GasMeter;
//# sourceMappingURL=gas-api.js.map