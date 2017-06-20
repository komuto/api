import 'babel-polyfill';
import express from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import jsend from 'jsend';
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
import image from './modules/image';

const app = express();

process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.log('Unhandled Rejection:', err.stack);
});

app.use(statusMonitor());
app.use(responseTime());
app.use(jsend.middleware);
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(config.publicPath, { maxAge: c.ONE_YEAR }));

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

// connect to data source
// core.mysql.connect(config.knex);

// configure middleware
app.use(core.middleware.requestLoggerMiddleware());
app.use(core.middleware.requestUtilsMiddleware());

app.use(core.routes);
app.use(user.routes);
app.use(category.routes);
app.use(expedition.routes);
app.use(address.routes);
app.use(brand.routes);
app.use(product.routes);

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
    code: err.httpStatus,
    message: err.message,
    data: {},
  });
});

export default app;
