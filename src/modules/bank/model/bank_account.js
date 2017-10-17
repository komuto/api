import core from '../../core';
import { getAccountError } from './../messages';

const { parseNum } = core.utils;
const bookshelf = core.postgres.db;

export const BankAccountStatus = {
  NOT_PRIMARY: 0,
  PRIMARY: 1,
};

class BankAccountModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'rekening_users';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_rekeninguser';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize({ minimal = false } = {}) {
    const bank = {
      id: this.get('id_rekeninguser'),
      user_id: this.get('id_users'),
      bank_id: !this.relations.bank ? this.get('id_masterbank') : undefined,
      bank: this.relations.bank ? this.related('bank') : undefined,
      holder_name: this.get('nama_pemilikrekening'),
      holder_account_number: this.get('nomor_rekening'),
    };
    if (minimal) return bank;
    return {
      ...bank,
      marketplace_id: this.get('id_marketplaceuser'),
      bank_branch_office_name: this.get('cabang_bankrekeninguser'),
      is_primary: parseNum(this.get('primary_rekening')) === BankAccountStatus.PRIMARY,
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
    return await this.where({ id_users: userId }).fetchAll({ withRelated: ['bank'] });
  }

  /**
   * Check komuto bank account
   */
  static async checkKomutoAccount(id) {
    const bankAccount = await this.where({ id_rekeninguser: id }).fetch();
    if (!bankAccount) throw getAccountError('account', 'not_found');
    if (bankAccount.serialize().marketplace_id !== 0) {
      throw getAccountError('account', 'not_komuto');
    }
    return bankAccount;
  }

  /**
   * @param id {int} bank account id
   * @param userId {int}
   */
  static async getBankAccount(id, userId) {
    return await this.where({ id_rekeninguser: id, id_users: userId }).fetch();
  }

  static async getKomutoAccounts() {
    return await this.where({ id_marketplaceuser: 0 }).fetchAll({ withRelated: ['bank'] });
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      master_bank_id: 'id_masterbank',
      holder_name: 'nama_pemilikrekening',
      holder_account_number: 'nomor_rekening',
      bank_branch_office_name: 'cabang_bankrekeninguser',
      is_primary: 'primary_rekening',
      user_id: 'id_users',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop] && data[prop] !== undefined) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const BankAccount = bookshelf.model('BankAccount', BankAccountModel);

