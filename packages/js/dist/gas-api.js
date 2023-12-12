"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GasMeter = void 0;
const internal_utils_1 = require("./internal-utils");
/**
 * A gas meter keeps track of the amount of gas seen by the worker.
 * It must be added to the worker before any transactions are run.
 */
class GasMeter {
    constructor(worker) {
        this._elapsed = 0;
        const meter_ref = new WeakRef(this);
        worker.add_callback((burnt) => {
            const meter = meter_ref.deref();
            if (meter !== undefined) {
                meter._elapsed += burnt;
            }
        });
        (0, internal_utils_1.debug)('Lifecycle.GasMeter.created()');
    }
    get elapsed() {
        return this._elapsed;
    }
    reset() {
        this._elapsed = 0;
    }
}
exports.GasMeter = GasMeter;
//# sourceMappingURL=gas-api.js.map