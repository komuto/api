import 'babel-polyfill';
import 'log-full';
import express from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import statusMonitor from 'express-status-monitor';
import responseTime from 'response-time';
import * as admin from 'firebase-admin';
import serviceAccount from './../config/serviceAccountKey.json';
import config from '../config';
import c from './constants';
import core from './modules/core';
import user from './modules/user';
import category from './modules/category';
import expedition from './modules/expedition';
import address from './modules/address';
import brand from './modules/brand';
import product from './modules/product';
import bank from './modules/bank';
import review from './modules/review';
import store from './modules/store';
import image from './modules/image';
import bucket from './modules/bucket';
import otp from './modules/OTP';
import payment from './modules/payment';
import marketplace from './modules/marketplace';
import saldo from './modules/saldo';
import midtrans from './modules/midtrans';

const app = express();

// core.cacheClear();

app.use(core.middleware.winstonLogger());

process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.log('Unhandled Rejection:', err.stack);
});

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

app.use(statusMonitor());
app.use(responseTime());
app.use(cors());
app.use(helmet());
app.use(compression());

// midtrans notification
app.use(midtrans.routes);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(config.publicPath, { maxAge: c.ONE_YEAR }));
app.use((req, res, next) => {
  res.header('Content-Type', 'application/json');
  next();
});
app.set('trust proxy', 1);

// configure passport middleware
// this must be defined after session middleware
// see: http://passportjs.org/docs#middleware
user.passport.configure(app);

// set default express behavior
// disable x-powered-by signature
// and enable case-sensitive routing
app.set('env', config.env);
app.set('x-powered-by', false);
app.set('case sensitive routing', true);

// configure middleware
app.use(core.middleware.requestUtilsMiddleware());

app.prefix = (router => (app.use('/:mp', router)));

app.use(core.routes);

app.prefix(marketplace.middleware.verify());
app.prefix(image.routes);

app.use(core.middleware.checkContentType());

app.prefix(user.routes);
app.prefix(category.routes);
app.prefix(expedition.routes);
app.prefix(address.routes);
app.prefix(brand.routes);
app.prefix(product.routes);
app.prefix(bank.routes);
app.prefix(review.routes);
app.prefix(store.routes);
app.prefix(bucket.routes);
app.prefix(otp.routes);
app.prefix(payment.routes);
app.prefix(saldo.routes);

app.use(core.middleware.pathNotFound());
app.use(core.middleware.errResponse());

export default app;
