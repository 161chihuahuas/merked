'use strict';

const { DAG } = require('../lib/dag');
const { expect } = require('chai');


describe('DAG', function() {

  const buffer = Buffer.concat([
    Buffer.from('0000', 'hex'),
    Buffer.from('0010', 'hex'),
    Buffer.from('0020', 'hex'),
    Buffer.from('0030', 'hex'),
    Buffer.from('0040', 'hex'),
    Buffer.from('0050', 'hex'),
    Buffer.from('0060', 'hex'),
    Buffer.from('0070', 'hex'),
    Buffer.from('0080', 'hex'),
    Buffer.from('0090', 'hex')
  ]);

  let dag;

  it('creates an instance from a buffer', function() {
    dag = DAG.fromBuffer(buffer, 2);
    expect(dag).to.be.instanceOf(DAG);
  });

  it('export metadata', function() {
    const metadata = dag.toMetadata();
    expect(typeof metadata).to.equal('string');
    expect(metadata).to.equal('{"n":"blob","l":["96a296d224f285c67bee93c30f8a309157f0daa35dc5b87e410b78630a09cfc7","0298d122906dcfc10892cb53a73992fc5b9f493ea4c9badb27b791b4127a7fe7","474f2af47544e9c7ce4338cabd43c5ca1c26432b7300ce387406157ea433891f","db3426e878068d28d269b6c87172322ce5372b65756d0789001d34835f601c03","b8811852747cfa3620c3dd2af5d59498c240f208e689b4052bac934c29faf094","99d024a68d4d9728c47928d959ebd3bc621782c9d5fb3a1f7db35c4423fb97e7","f66d0942831c3fc3a5d7b1399bc2f9027f95f8d735ae2a78f2240c7cefde526b","4cf5af027d9a949a881e505bd7c7b14c5eb61ff47d159b585a331d690501d13d","085edad400785fca7e7e90b1fac4beb776fc2beee5aa24352d5f39b5d57efcad","c723228fbe3cf04cdf49e61f3e13fc0c407d2e1ff23d6eaa1b4299e7cbb418a1"],"r":"08541c3238e4be60e2b8f049deee8b0bd2c91829c3b4f47f1b703bd4d48d2ff3","s":20}');
  });

});
