import './initialize';
import * as utils from './utils';
import * as middleware from './middleware';
import controller from './controller';
import postgres from './knex';
import routes from './routes';
import cache from './cache';
import config from '../../../config';

const imagePath = (path, file) => `${config.imageUrl}/${path}/${file}`;

export default { utils, controller, middleware, postgres, routes, cache, imagePath };
