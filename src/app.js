import 'babel-polyfill';
import 'log-full';
import express from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import statusMonitor from 'express-status-monitor';
import responseTime from 'response-time';
import moment from 'moment';
import ch from 'chalk';
import morgan from 'morgan';
import winston from 'winston';
import 'winston-daily-rotate-file';
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

const app = express();

const logger = new (winston.Logger)({
  transports: [
    new winston.transports.DailyRotateFile({
      filename: config.logPath,
      datePattern: 'yyyy-MM-dd.',
      prepend: true,
      level: 'debug',
      timestamp: () => moment().format('YYYY-MM-DD HH:mm:ss'),
      json: false,
    }),
  ],
});

logger.stream = {
  write: (message) => {
    logger.info(message);
  },
};

core.cacheClear();

morgan.token('body', req => `\n${JSON.stringify(req.body, null, 2)}`);

app.use(morgan(`${ch.red(':method')} ${ch.green(':url')} ${ch.yellow(':response-time ms')} :body`, { stream: logger.stream }));

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

app.use((req, res, next) => {
  const err = new Error('Path Not Found');
  err.httpStatus = 404;
  next(err);
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.httpStatus || 406;
  res.status(statusCode).json({
    status: false,
    code: err.httpStatus || 406,
    message: err.message,
    data: err.data || {},
  });
});

export default app;
