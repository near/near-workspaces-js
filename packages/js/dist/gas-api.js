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
            console.log('GasMeter.tx_callback()', burnt.toString());
            await this._mutex;
            // FIXME: add op fails to work
            {
                const trial = near_units_1.Gas.from(0);
                trial.add(burnt);
                console.log(`Gas burnt is ${burnt.toString()} while trial has been updated to ${trial.toString()}`);
            }
            this._elapsed = near_units_1.Gas.from(this._elapsed.toNumber() + burnt.toNumber());
            console.log('GasMeter.tx_callback() updated', this._elapsed.toString());
            this._mutex = Promise.resolve();
        };
    }
    get elapsed() {
        console.log('GasMeter.elapsed()', this._elapsed.toString());
        return this._elapsed;
    }
    reset() {
        console.log('GasMeter.reset()');
        this._elapsed = near_units_1.Gas.from(0);
    }
}
exports.GasMeter = GasMeter;
//# sourceMappingURL=gas-api.js.map