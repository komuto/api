import 'babel-polyfill';
import 'log-full';
import express from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import statusMonitor from 'express-status-monitor';
import responseTime from 'response-time';
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

const app = express();

core.cacheClear();

app.use(core.middleware.winstonLogger());

process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.log('Unhandled Rejection:', err.stack);
});

app.use(statusMonitor());
app.use(responseTime());
app.use(cors());
app.use(helmet());
app.use(compression());
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
app.use(core.middleware.requestLoggerMiddleware());
app.use(core.middleware.requestUtilsMiddleware());

app.use(image.routes);

app.use(core.middleware.checkContentType());

app.use(core.routes);
app.use(user.routes);
app.use(category.routes);
app.use(expedition.routes);
app.use(address.routes);
app.use(brand.routes);
app.use(product.routes);
app.use(bank.routes);
app.use(review.routes);
app.use(store.routes);
app.use(bucket.routes);
app.use(otp.routes);
app.use(payment.routes);

app.use(core.middleware.pathNotFound());
app.use(core.middleware.errResponse());

export default app;
