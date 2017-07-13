import core from '../../core';

const bookshelf = core.postgres.db;

class BankAccountModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'rekening_users';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_rekeninguser';
  }

  serialize() {
    return {
      id: this.get('id_rekeninguser'),
      user_id: this.get('id_users'),
      bank_id: !this.relations.bank ? this.get('id_masterbank') : undefined,
      bank: this.relations.bank ? this.related('bank') : undefined,
      holder_name: this.get('nama_pemilikrekening'),
      holder_account_name: this.get('nomor_rekening'),
      bank_branch_office_name: this.get('cabang_bankrekeninguser'),
      is_primary: this.get('primary_rekening') === '1',
    };
  }

  /**
   * Add relation to BankAccount
   */
  bank() {
    return this.belongsTo('Bank', 'id_masterbank');
  }

  /**
   * Get bank accounts by user id
   */
  static async getByUserId(userId) {
    return this.where({ id_users: userId }).fetchAll({ withRelated: ['bank'] });
  }
}

export const BankAccount = bookshelf.model('BankAccount', BankAccountModel);
export default { BankAccount };

