import { Gas } from 'near-units';
/**
 * A gas meter keeps track of the amount of gas seen by the worker.
 * The tx_callback should be added to the Worker on construction.
 */
export declare class GasMeter {
    private _elapsed;
    private _mutex;
    tx_callback(): (burnt: Gas) => Promise<void>;
    get elapsed(): Gas;
    reset(): Promise<void>;
}
//# sourceMappingURL=gas-api.d.ts.map