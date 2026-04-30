'use strict';

/**
 * snowflake-id
 *
 * High-performance 64-bit distributed unique ID generator.
 *
 * Quick start:
 *
 *   import { createGenerator } from './index.js';
 *
 *   const gen = createGenerator({ workerId: 1, datacenterId: 0 });
 *   const id  = gen.nextId();        // → BigInt
 *   const str = gen.nextIdString();  // → '929310234123423744'
 *   const hex = gen.nextIdHex();     // → '0ce9f4ab3d800000'
 *   const info = gen.parse(id);      // → { timestamp, date, workerId, ... }
 */

export { SnowflakeGenerator, DEFAULT_EPOCH } from './SnowflakeGenerator.js';
export { SnowflakePool }                     from './SnowflakePool.js';

import { SnowflakeGenerator } from './SnowflakeGenerator.js';
import { SnowflakePool }      from './SnowflakePool.js';

/**
 * Create a single Snowflake generator.
 * @param {object} [options]
 * @param {number} [options.workerId=0]
 * @param {number} [options.datacenterId=0]
 * @param {bigint|number} [options.epoch]
 * @returns {SnowflakeGenerator}
 */
export function createGenerator(options = {}) {
  return new SnowflakeGenerator(options);
}

/**
 * Create a pool of Snowflake generators (for high-throughput / multi-worker setups).
 * @param {object}   [options]
 * @param {number}   [options.datacenterId=0]
 * @param {number[]} [options.workerIds=[0,1,2,3]]
 * @param {bigint|number} [options.epoch]
 * @returns {SnowflakePool}
 */
export function createPool(options = {}) {
  return new SnowflakePool(options);
}

/**
 * Parse a Snowflake ID (static utility, no instance needed).
 * @param {bigint|string|number} id
 * @param {bigint|number}        [epoch]
 * @returns {object}
 */
export function parse(id, epoch) {
  return SnowflakeGenerator.parse(id, epoch);
}