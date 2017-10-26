import knex from 'knex';
import bookshelf from 'bookshelf';
import cfg from '../../../config';
import knexTime from './knexTime';

/**
 * Connect to mysql instance
 * @param {object} config
 * @return {Promise}
 * TODO: add log file for debugging
 */
function connect(config) {
  const knexInit = knex(config);
  return { knexInit, db: bookshelf(knexInit) };
}

const { db, knexInit } = connect(cfg.knex);
db.plugin('pagination');
db.plugin('registry');

knexTime(knexInit);

export default { db, knex: knexInit };
