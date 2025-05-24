/**
 * A Merkle DAG (Directed Acyclic Graph) is a data structure used in decentralized 
 * systems, where each node contains a hash of its content and links to its child 
 * nodes. This structure allows for efficient data verification and deduplication, 
 * ensuring that data remains immutable and securely linked.
 * @module merked
 */
'use strict';

/** {@link module:merked/dag} */
module.exports.dag = require('./lib/dag');

/** {@link module:merked/tree} */
module.exports.tree = require('./lib/tree');
