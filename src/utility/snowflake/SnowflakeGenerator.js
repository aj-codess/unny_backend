'use strict';

/**
 * SnowflakeGenerator
 *
 * A high-performance, 64-bit unique ID generator inspired by Twitter's Snowflake.
 *
 * Bit layout (64 bits total):
 * ┌──────────────────────────────────────────┬────────────────┬──────────────┬─────────────┐
 * │           Timestamp (41 bits)            │ Datacenter     │ Worker       │ Sequence    │
 * │           ms since custom epoch          │ ID (5 bits)    │ ID (5 bits)  │ (12 bits)   │
 * └──────────────────────────────────────────┴────────────────┴──────────────┴─────────────┘
 *
 * Max throughput: 4096 IDs/ms per worker (4,096,000 IDs/sec)
 * Unique workers: 1024 (32 datacenters × 32 workers)
 * Lifespan:       ~69 years from epoch
 *
 * IDs are returned as BigInt for precision (JS numbers lose precision above 2^53).
 */

// Bit lengths
const TIMESTAMP_BITS   = 41;
const DATACENTER_BITS  = 5;
const WORKER_BITS      = 5;
const SEQUENCE_BITS    = 12;

// Max values (derived from bit lengths)
const MAX_DATACENTER_ID = (1n << BigInt(DATACENTER_BITS)) - 1n; // 31
const MAX_WORKER_ID     = (1n << BigInt(WORKER_BITS))     - 1n; // 31
const MAX_SEQUENCE      = (1n << BigInt(SEQUENCE_BITS))   - 1n; // 4095

// Bit shift positions
const WORKER_SHIFT      = SEQUENCE_BITS;                              // 12
const DATACENTER_SHIFT  = SEQUENCE_BITS + WORKER_BITS;                // 17
const TIMESTAMP_SHIFT   = SEQUENCE_BITS + WORKER_BITS + DATACENTER_BITS; // 22

// Default epoch: 2020-01-01T00:00:00.000Z
export const DEFAULT_EPOCH = 1577836800000n;

export class SnowflakeGenerator {
  /**
   * @param {object}        [options]
   * @param {number}        [options.workerId=0]      Worker ID (0–31)
   * @param {number}        [options.datacenterId=0]  Datacenter ID (0–31)
   * @param {bigint|number} [options.epoch]            Custom epoch in ms (Unix). Defaults to 2020-01-01.
   */
  constructor(options = {}) {
    const {
      workerId     = 0,
      datacenterId = 0,
      epoch        = DEFAULT_EPOCH,
    } = options;

    const wId = BigInt(workerId);
    const dId = BigInt(datacenterId);

    if (wId < 0n || wId > MAX_WORKER_ID) {
      throw new RangeError(`workerId must be between 0 and ${MAX_WORKER_ID}. Got: ${workerId}`);
    }
    if (dId < 0n || dId > MAX_DATACENTER_ID) {
      throw new RangeError(`datacenterId must be between 0 and ${MAX_DATACENTER_ID}. Got: ${datacenterId}`);
    }

    this._workerId      = wId;
    this._datacenterId  = dId;
    this._epoch         = BigInt(epoch);
    this._sequence      = 0n;
    this._lastTimestamp = -1n;

    // Pre-compute the static middle bits (datacenter + worker) — never changes
    this._nodeId = (dId << BigInt(DATACENTER_SHIFT)) | (wId << BigInt(WORKER_SHIFT));

    // Expose read-only public accessors without freezing the instance
    Object.defineProperties(this, {
      workerId:     { get: () => Number(this._workerId),     enumerable: true, configurable: false },
      datacenterId: { get: () => Number(this._datacenterId), enumerable: true, configurable: false },
      epoch:        { get: () => Number(this._epoch),        enumerable: true, configurable: false },
    });
  }

  // ─── Core ID Generation ──────────────────────────────────────────────────────

  /**
   * Generate a single Snowflake ID.
   * @returns {bigint}
   */
  nextId() {
    let timestamp = this._currentTime();

    if (timestamp < this._lastTimestamp) {
      // Clock moved backwards — wait for it to catch up
      timestamp = this._waitUntil(this._lastTimestamp);
    }

    if (timestamp === this._lastTimestamp) {
      this._sequence = (this._sequence + 1n) & MAX_SEQUENCE;
      if (this._sequence === 0n) {
        // Sequence exhausted in this ms — block until next ms
        timestamp = this._waitUntil(this._lastTimestamp);
      }
    } else {
      this._sequence = 0n;
    }

    this._lastTimestamp = timestamp;

    return (
      ((timestamp - this._epoch) << BigInt(TIMESTAMP_SHIFT)) |
      this._nodeId |
      this._sequence
    );
  }

  /**
   * Generate N Snowflake IDs in bulk.
   * More efficient than calling nextId() in a loop for large batches.
   * @param {number} count  Number of IDs to generate
   * @returns {bigint[]}
   */
  nextIds(count) {
    if (!Number.isInteger(count) || count < 1) {
      throw new TypeError(`count must be a positive integer. Got: ${count}`);
    }
    const ids = new Array(count);
    for (let i = 0; i < count; i++) {
      ids[i] = this.nextId();
    }
    return ids;
  }

  // ─── ID Deconstruction ───────────────────────────────────────────────────────

  /**
   * Decompose a Snowflake ID back into its components.
   * @param {bigint|string|number} id
   * @returns {{ id: string, timestamp: number, date: Date, datacenterId: number, workerId: number, sequence: number }}
   */
  parse(id) {
    const snowflake   = BigInt(id);
    const timestamp   = (snowflake >> BigInt(TIMESTAMP_SHIFT)) + this._epoch;
    const datacenterId = (snowflake >> BigInt(DATACENTER_SHIFT)) & MAX_DATACENTER_ID;
    const workerId    = (snowflake >> BigInt(WORKER_SHIFT))    & MAX_WORKER_ID;
    const sequence    = snowflake & MAX_SEQUENCE;

    const ms = Number(timestamp);
    return {
      id:           snowflake.toString(),
      timestamp:    ms,
      date:         new Date(ms),
      datacenterId: Number(datacenterId),
      workerId:     Number(workerId),
      sequence:     Number(sequence),
    };
  }

  // ─── Format Helpers ──────────────────────────────────────────────────────────

  /**
   * Returns the next ID as a decimal string (safe for JSON / databases).
   * @returns {string}
   */
  nextIdString() {
    return this.nextId().toString();
  }

  /**
   * Returns the next ID as a zero-padded hex string (16 chars).
   * @returns {string}
   */
  nextIdHex() {
    return this.nextId().toString(16).padStart(16, '0');
  }

  // ─── Static Utilities ────────────────────────────────────────────────────────

  /**
   * Parse a Snowflake ID without an instance (uses default epoch).
   * @param {bigint|string|number} id
   * @param {bigint|number}        [epoch=DEFAULT_EPOCH]
   * @returns {object}
   */
  static parse(id, epoch = DEFAULT_EPOCH) {
    const gen = new SnowflakeGenerator({ epoch });
    return gen.parse(id);
  }

  /**
   * Returns generator metadata and limits.
   * @returns {object}
   */
  static get limits() {
    return {
      maxDatacenterId: Number(MAX_DATACENTER_ID),
      maxWorkerId:     Number(MAX_WORKER_ID),
      maxSequence:     Number(MAX_SEQUENCE),
      maxIdsPerMs:     Number(MAX_SEQUENCE) + 1,
      lifespanYears:   Math.floor(Number((1n << BigInt(TIMESTAMP_BITS)) - 1n) / (1000 * 60 * 60 * 24 * 365)),
    };
  }

  // ─── Internal ────────────────────────────────────────────────────────────────

  /** @returns {bigint} current time in ms */
  _currentTime() {
    return BigInt(Date.now());
  }

  /**
   * Spin-wait until the clock advances past `lastTimestamp`.
   * Only called on sequence overflow or clock regression (rare).
   * @param {bigint} lastTimestamp
   * @returns {bigint}
   */
  _waitUntil(lastTimestamp) {
    let ts = this._currentTime();
    while (ts <= lastTimestamp) {
      ts = this._currentTime();
    }
    return ts;
  }
}