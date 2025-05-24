#!/usr/bin/env node

const merked = require('..');
const fileIn = process.argv[2] || '-';
const sliceSize = process.argv[3] ? parseInt(process.argv[3]) : 512;

let buffer = Buffer.from([]);

if (fileIn === '-') {
  process.stdin.on('data', data => buffer = Buffer.concat([buffer, data]));
  process.stdin.on('end', () => merkFile());
} else {
  buffer = require('node:fs').readFileSync(fileIn);
  merkFile();
}

function merkFile() {
  const graph = merked.dag.DAG.fromBuffer(buffer, sliceSize);
  const meta = graph.toMetadata(fileIn);
  const inputs = JSON.stringify(graph.shards.map(s => s.toString('hex')));

  console.log(meta);
  console.log(inputs);
}
