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
def.logPath = path.join(rootDir, 'logs/log');

// images
def.imagePath = path.join(rootDir, 'public/image');
def.imageMaxWidth = 1000;
def.imageFolder = {};
def.imageFolder.store = 'toko';
def.imageFolder.product = 'produk';
def.imageFolder.payment = 'payment_confirmation';
def.imageFolder.profile = 'profile';
def.imageFolder.resolution = 'resolution';
def.imageFolder.dispute = 'dispute';
def.imageFolder.payment_method = 'payment';
def.imageFolder.bank = 'bank';
def.defaultImage = {};
def.defaultImage.user = 'https://www.juptr.io/images/default-user.png';
def.defaultImage.product = 'https://komutodev.aptmi.com/uploads/produk/noimage.png';

def.cdnPath = 'http://cdn.localhost.com';

// knexjs config
def.knex = {};
def.knex.client = 'postgres';
def.knex.debug = false;
def.knex.executionTimeDebug = true;
def.knex.connection = {};
def.knex.connection.host = '127.0.0.1';
def.knex.connection.user = 'postgres';
def.knex.connection.password = 'root';
def.knex.connection.database = 'komuto';
def.knex.connection.charset = 'utf8';

def.knex.connection.host = 'db-development.aptmi.com';
def.knex.connection.user = 'komuto';
def.knex.connection.password = 'Apt4M3d14C0mut0';
def.knex.connection.database = 'komuto';
def.knex.connection.charset = 'utf8';

// jwt config
def.jwt = {};
def.jwt.secretOrKey = 'MY-APP';
def.jwt.issuer = 'pionize.com';
def.jwt.audience = 'pionize.com';
def.jwt.expiry = '7d';

// mailer config
def.emailServiceAdapter = 'sendgrid';
def.emailKey = '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';
def.emailFrom = 'no-reply@skyshi.com';

// url builder
def.url = (dir = '/') => {
  const port = ((def.https && def.port !== 443) || (!def.https && def.port !== 80)) ? `:${def.port}` : '';
  return `http${def.https ? 's' : ''}://${def.host}${port}${dir}`;
};

// komuto url & email
def.komutoUrl = 'http://api.komutodev.aptmi.com/komuto-api/';
def.assetUrl = 'https://komutodev.aptmi.com';
def.komutoEmail = 'developer@skyshi.com';

// OTP sms
def.otp = {};
def.otp.apiUrl = 'http://180.250.93.178:6754/index.php/sms/';
def.otp.apiKey = 'a12ea25c2ffa6f262f00f1c19ad335549c94ab34';

// cache expired
def.cache = {};
def.cache.prefix = 'komuto-api';
def.cache.debug = true;
def.cache.enable = true;
def.cache.duration = 1800000; // in ms: 30 minutes

// Midtrans auth
def.midtrans = {};
def.midtrans.clientKey = 'VT-client-Kh2JdUMi7H9ij1hW';
def.midtrans.serverKey = 'VT-server-mKN5sKSvcf1fk3Rap8wSrusA';
def.midtrans.isProduction = true;

def.defaultApiDomain = 'api.komuto.skyshi.com';

cfg.resolveLocalConfig(__dirname, (err, file) => {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  if (!err) cfg.merge(def, require(file));
});

module.exports = def;
