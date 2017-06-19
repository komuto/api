const path = require('path');
const cfg = require('../common/config');

const def = {};

// setup default env
def.env = process.env.NODE_ENV || 'development';
process.env.NODE_ENV = def.env;

def.debug = true;
def.https = false;
def.host = 'localhost';
def.port = 4000;

// paths
const rootDir = path.dirname(__dirname);
def.publicPath = path.join(rootDir, 'public');
def.cachePath = path.join(rootDir, 'cache');
def.tempPath = path.join(rootDir, 'temp');

def.cdnPath = 'http://cdn.localhost.com';

// knexjs config
def.knex = {};
def.knex.client = 'postgres';
def.knex.connection = {};
def.knex.connection.host = '127.0.0.1';
def.knex.connection.user = 'postgres';
def.knex.connection.password = '12345678';
def.knex.connection.database = 'komuto_api';
def.knex.connection.charset = 'utf8';

// jwt config
def.jwt = {};
def.jwt.secretOrKey = 'MY-APP';
def.jwt.issuer = 'pionize.com';
def.jwt.audience = 'pionize.com';

// mailer config
def.emailServiceAdapter = 'sendgrid';

// fb api config
def.fb = {};
def.fb.appId = '123456789';
def.fb.appSecret = '123456677889'

// url builder
def.url = (dir = '/') => {
  const port = ((def.https && def.port !== 443) || (!def.https && def.port !== 80)) ? `:${def.port}` : '';
  return `http${def.https ? 's' : ''}://${def.host}${port}${dir}`;
};

// komuto url
def.komutoUrl = 'http://api.komutodev.aptmi.com/komuto-api/';

// cache expired
def.cacheExp = '30 minutes';

cfg.resolveLocalConfig(__dirname, (err, file) => {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  if (!err) cfg.merge(def, require(file));
});

module.exports = def;
