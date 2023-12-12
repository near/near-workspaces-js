import {debug} from './internal-utils';
import {Worker} from './worker';

/**
 * A gas meter keeps track of the amount of gas seen by the worker.
 * It must be added to the worker before any transactions are run.
 */
export class GasMeter {
  private _elapsed = 0;

  constructor(worker: Worker) {
    const meter_ref = new WeakRef(this);
    worker.add_callback((burnt: number) => {
      const meter = meter_ref.deref();
      if (meter !== undefined) {
        meter._elapsed += burnt;
      }
    });

    debug('Lifecycle.GasMeter.created()');
  }

  get elapsed() {
    return this._elapsed;
  }

  reset(): void {
    this._elapsed = 0;
  }
}
