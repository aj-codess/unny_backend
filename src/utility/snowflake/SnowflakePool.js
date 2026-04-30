'use strict';

import { SnowflakeGenerator } from './SnowflakeGenerator.js';

/**
 * SnowflakePool
 *
 * Manages a pool of SnowflakeGenerators across multiple workers.
 * Uses round-robin dispatch to distribute ID generation load.
 *
 * Useful when you want to maximize throughput beyond 4096 IDs/ms
 * or simulate a multi-node distributed environment locally.
 */
export class SnowflakePool {
  /**
   * @param {object}        [options]
   * @param {number}        [options.datacenterId=0]  Shared datacenter ID
   * @param {number[]}      [options.workerIds]        Array of worker IDs to create generators for
   * @param {bigint|number} [options.epoch]            Custom epoch
   */
  constructor(options = {}) {
    const {
      datacenterId = 0,
      workerIds    = [0, 1, 2, 3],
      epoch,
    } = options;

    if (!Array.isArray(workerIds) || workerIds.length === 0) {
      throw new TypeError('workerIds must be a non-empty array.');
    }

    this._generators = workerIds.map(
      workerId => new SnowflakeGenerator({ workerId, datacenterId, ...(epoch != null && { epoch }) })
    );
    this._index = 0;
    this._size  = this._generators.length;
  }

  /**
   * Get the next ID from the pool (round-robin).
   * @returns {bigint}
   */
  nextId() {
    const id = this._generators[this._index].nextId();
    this._index = (this._index + 1) % this._size;
    return id;
  }

  /**
   * Get the next ID as a string.
   * @returns {string}
   */
  nextIdString() {
    return this.nextId().toString();
  }

  /**
   * Generate N IDs distributed across the pool.
   * @param {number} count
   * @returns {bigint[]}
   */
  nextIds(count) {
    const ids = new Array(count);
    for (let i = 0; i < count; i++) {
      ids[i] = this.nextId();
    }
    return ids;
  }

  /** @returns {number} Number of workers in the pool */
  get size() {
    return this._size;
  }

  /** @returns {SnowflakeGenerator[]} */
  get generators() {
    return [...this._generators];
  }
}