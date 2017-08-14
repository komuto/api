const Cryptorjs = require('cryptorjs');
const config = require('../config');

const crypt = new Cryptorjs(config.secretKey);

const id = parseInt(process.argv[process.argv.length - 1], 10);
const encoded = crypt.encode({ id });

console.log({ id, encoded });
