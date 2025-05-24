/**
 * A directed acyclic graph (DAG) is a type of graph that consists of vertices 
 * connected by directed edges, where there are no cycles, meaning you cannot 
 * return to the same vertex by following the direction of the edges.
 * @module merked/dag
 */

'use strict';

const { getRandomValues } = require('node:crypto');
const { splitSync } = require('node-split');
const { MerkleTree } = require('./tree');


class DAG {
 
  /**
   * @typedef module:merked/dag~DAG~Options
   * @type {object}
   * @property {number} sliceIndex - Where original input becomes padding
   * @property {function} hashFunc - Hash function to use for {@link module:merked/tree~MerkleTree}
   */

  /**
   * Computes the default options for {@link DAG} instance given a shard array.
   * @static
   * @param {Buffer[]} shards - Array of buffers to use as hashed leaf input
   * @returns {module:merked/dag~DAG~Options}
   */
  static DEFAULT_OPTS(shards = []) {
    let byteLength = 0;

    shards.forEach(s => byteLength += s.length);

    return {
      sliceIndex: byteLength,
      hashFunc: MerkleTree.DEFAULT_HASH_FUNC
    };
  }

  /**
   * Given a list of uniform buffers, construct a Merkle Tree.
   * @constructor
   * @param {Array<Buffer>} shards - Uniform shards to compose an entry
   * @param {module:merked/dag~DAG~Options} [options]
   */
  constructor(shards, opts = {}) {
    const defaults = DAG.DEFAULT_OPTS(shards);

    this.shards = shards;
    this.leaves = this.shards.map(opts.hashFunc || defaults.hashFunc);
    this.merkle = new MerkleTree(this.leaves, opts.hashFunc || defaults.hashFunc);
    this.entries = [];
    this.sliceIndex = typeof opts.sliceIndex === 'undefined'
      ? defaults.sliceIndex
      : opts.sliceIndex;

    for (let i = 0; i < this.shards.length; i++) {
      this.entries.push([this.leaves[i], this.shards[i]]);
    }

    for (let i = 0; i < this.merkle.length; i++) {
      this.entries.push([this.leaves[i], this.shards[i]]);
    }
  }

  /**
   * Get the underlying shard array.
   * @returns {Array<Buffer>}
   */
  toArray() {
    return this.shards;
  }

  /**
   * @typedef module:merked/dag~DAG~Metadata
   * @type {object}
   * @property {string} n - Application-specific name
   * @property {Array<string>} l - Input leaves as hex
   * @property {string} r - Root merkle node as hex
   * @property {number} s - Index where content ends and padding begins
   */

  /**
   * Export a serializable metadata object
   * @param {string} [name="blob"] - Application-specific tag or filename
   * @returns {module:merked/dag~DAG~Metadata}
   */
  toMetadata(name) {
    return JSON.stringify({
      n: name || 'blob',
      l: this.leaves.map(l => l.toString('hex')),
      r: this.merkle.root().toString('hex'),
      s: this.sliceIndex
    });
  }

  /**
   * @property {string} DEFAULT_INPUT_SIZE
   * @memberof {DAG}
   */ 
  static get DEFAULT_INPUT_SIZE() {
    return '4M';
  }

  /**
   * Construct a {@link DAG} from a Buffer.
   * @param {Buffer} buffer - Raw input bytes
   * @param {number} [sliceSize={DAG.DEFAULT_INPUT_SIZE}] - Split buffer into uniform chunks
   * @param {function} [hashFunc={module:merked/tree~MerkleTree.DEFAULT_HASH_FUNC}] - Hash function to use
   * @param {boolean} [padLastSlice=false] - If true, pad the final slice before hashing
   * @param {boolean} [randomFill=false] - If true, pad with random bytes (will always result in a different tree)
   * @returns {DAG}
   */
  static fromBuffer(buffer, sliceSize = DAG.DEFAULT_INPUT_SIZE, hashFunc = MerkleTree.DEFAULT_HASH_FUNC, padLastSlice = false, randomFill = false) {
    const shards = splitSync(buffer, {
      bytes: sliceSize
    }).map(s => {
      let bufN = Buffer.alloc(sliceSize);
      bufN.fill(s);
      if (randomFill && bufN.length > s.length) {
        bufN.fill(DAG.randomFill(bufN.length - s.length), 
          s.length);
      } else {
        bufN.fill(0, s.length);
      }

      return bufN;
    });
    
    return new DAG(shards, { sliceIndex: buffer.length, hashFunc });
  }

  /**
   * Get a buffer filled with random bytes - used to pad last shard.
   * @param {number} numBytes - Size of buffer to create
   * @returns {Buffer}
   */
  static randomFill(numBytes) {
    const max = 65536;
    const buf = Buffer.alloc(numBytes);
    
    let offset = 0;

    while (offset < numBytes) {
      offset += buf.fill(getRandomValues(Buffer.alloc(max)), offset);
    }

    return buf;
  }
}

module.exports.DAG = DAG;
