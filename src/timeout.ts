import { clearTimeout, setTimeout } from 'timers';

import { MongoError } from './error';
import { noop } from './utils';

export class CSOTError extends MongoError {
  override get name(): 'CSOTError' {
    return 'CSOTError';
  }

  constructor(message: string, options?: { cause?: Error }) {
    super(message, options);
  }

  static is(error: unknown): error is CSOTError {
    return (
      error != null && typeof error === 'object' && 'name' in error && error.name === 'CSOTError'
    );
  }

  static from(error: CSOTError) {
    return new CSOTError(error.message, { cause: error });
  }
}

export class Timeout extends Promise<never> {
  get [Symbol.toStringTag](): 'Timeout' {
    return 'Timeout';
  }

  private expireTimeout: () => void;
  private timeoutError: CSOTError;
  private id: Parameters<typeof clearTimeout>[0];

  public start: number;
  public ended: number | null = null;
  public duration: number;
  public timedOut = false;

  public get remainingTime(): number {
    if (this.duration === 0) return Infinity;
    if (this.timedOut) return 0;
    const timePassed = Math.trunc(performance.now()) - this.start;
    return Math.max(0, this.duration - timePassed);
  }

  private constructor(
    executor: ConstructorParameters<typeof Promise<never>>[0] = () => null,
    duration = 0
  ) {
    let reject!: Parameters<ConstructorParameters<typeof Promise<never>>[0]>[1];

    super((_, promiseReject) => {
      reject = promiseReject;
      executor(noop, promiseReject);
    });

    this.timeoutError = new CSOTError('Timeout!');
    this.expireTimeout = () => {
      this.ended = Math.trunc(performance.now());
      this.timedOut = true;
      reject(CSOTError.from(this.timeoutError));
    };

    this.duration = duration;
    this.start = Math.trunc(performance.now());
    if (this.duration > 0) {
      this.id = setTimeout(this.expireTimeout, this.duration);
      // I see no reason CSOT should keep Node.js running, that's for the sockets to do
      if (typeof this.id.unref === 'function') {
        this.id.unref();
      }
    }
  }

  public clear(): void {
    clearTimeout(this.id);
    this.id = undefined;
  }

  /** Start the timer over, this only has effect if the timer has not expired. */
  public refresh() {
    if (this.timedOut) return;
    if (this.duration <= 0) return;

    this.start = Math.trunc(performance.now());
    if (
      this.id != null &&
      typeof this.id === 'object' &&
      'refresh' in this.id &&
      typeof this.id?.refresh === 'function'
    ) {
      this.id.refresh();
      return;
    }

    this.id = setTimeout(this.expireTimeout, this.duration);
    if (typeof this.id.unref === 'function') {
      this.id.unref();
    }
  }

  public getMaxTimeMS(minRoundTripTime: number): any {
    if (minRoundTripTime < this.remainingTime) return this.remainingTime - minRoundTripTime;
    throw CSOTError.from(this.timeoutError);
  }

  public throwIfExpired() {
    if (this.timedOut) {
      throw CSOTError.from(this.timeoutError);
    }
  }

  /** Create a new pending Timeout with the same duration */
  public clone() {
    return Timeout.expires(this.duration);
  }

  public static expires(duration: number): Timeout {
    return new Timeout(undefined, duration);
  }

  static is(timeout: unknown): timeout is Timeout {
    return (
      typeof timeout === 'object' &&
      timeout != null &&
      Symbol.toStringTag in timeout &&
      timeout[Symbol.toStringTag] === 'Timeout'
    );
  }
}
