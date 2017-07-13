import './initialize';
import * as middleware from './middleware';
import * as model from './model';
import controller from './controller';
import passport from './passport';
import routes from './routes';

export default { model, middleware, passport, routes, controller };
