import {Gas} from 'near-units';

/**
 * A gas meter keeps track of the amount of gas seen by the worker.
 * The tx_callback should be added to the Worker on construction.
 */
export class GasMeter {
  private _elapsed = Gas.from(0);
  private _mutex = Promise.resolve();

  tx_callback(): (burnt: Gas) => Promise<void> {
    return async (burnt: Gas) => {
      await this._mutex;
      this._elapsed.add(burnt);
      this._mutex = Promise.resolve();
    };
  }

  get elapsed() {
    return this._elapsed;
  }

  reset(): void {
    this._elapsed = Gas.from(0);
  }
}
