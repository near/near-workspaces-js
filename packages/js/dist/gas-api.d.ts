import { Worker } from './worker';
/**
 * A gas meter keeps track of the amount of gas seen by the worker.
 * It must be added to the worker before any transactions are run.
 */
export declare class GasMeter {
    private _elapsed;
    constructor(worker: Worker);
    get elapsed(): number;
    reset(): void;
}
//# sourceMappingURL=gas-api.d.ts.map