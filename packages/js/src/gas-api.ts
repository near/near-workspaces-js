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
      console.log('GasMeter.tx_callback()', burnt.toString());
      await this._mutex;

      // FIXME: add op fails to work
      {
        const trial = Gas.from(0);
        trial.add(burnt);
        console.log(`Gas burnt is ${burnt.toString()} while trial has been updated to ${trial.toString()}`);
      }

      this._elapsed = Gas.from(this._elapsed.toNumber() + burnt.toNumber());

      console.log('GasMeter.tx_callback() updated', this._elapsed.toString());
      this._mutex = Promise.resolve();
    };
  }

  get elapsed() {
    console.log('GasMeter.elapsed()', this._elapsed.toString());
    return this._elapsed;
  }

  reset(): void {
    console.log('GasMeter.reset()');
    this._elapsed = Gas.from(0);
  }
}
