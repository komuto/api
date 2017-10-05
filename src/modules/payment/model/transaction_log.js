import core from '../../core';

const bookshelf = core.postgres.db;

class TransactionLogModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'log_transaction';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return ['create_at'];
  }

  static create(data) {
    return new this(data).save();
  }
}

export const TransactionLog = bookshelf.model('TransactionLog', TransactionLogModel);
export default { TransactionLog };
