# merked *shred data into a [merkle graph](https://en.wikipedia.org/wiki/Merkle_tree)*

```
npm install @tacticalchihuahua/merked
```

### usage: programmatic

```js
const { dag, tree } = require('@tacticalchihuahua/merked');
const merkleGraph = dag.DAG.fromBuffer(
    Buffer.from([/* ... */]), // any data you like
    1024, // slice size in bytes
    tree.MerkleTree.DEFAULT_HASH_FUNC, // hash function to use on inputs
    false, // pad the last slice to the slice size
    false // if padLastSlice fill with random bytes?
);

merkleGraph.toMetadata(); // returns serialized merkle tree
```

### usage: command line interface

```
# merk a file on disk
merk ./path/to/myfile.txt 1024

# merk from stdin
cat myfile.txt | merk - | jq 
```

### copying

anti-copyright 2025, tactical chihuahua  
licensed lgpl-3.0
