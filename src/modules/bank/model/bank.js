import moment from 'moment';
import _ from 'lodash';
import core from '../../core';
import { BadRequestError } from '../../../../common/errors';

const bookshelf = core.postgres.db;

export const BankStatus = {
  INACTIVE: 0,
  ACTIVE: 1,
};

class BankModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'master_bank';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_masterbank';
  }

  serialize() {
    return {
      id: this.get('id_masterbank'),
      name: this.get('nama_masterbank'),
      code: this.get('kode_masterbank'),
      status: this.get('status_masterbank'),
      status_at: moment(this.get('tglstatus_masterbank')).unix(),
      logo: this.get('logo_masterbank'),
    };
  }

  /**
   * Get all banks
   */
  static async getAll() {
    const banks = await this.where({}).fetchAll();
    if (!banks) throw new BadRequestError('No banks found');
    return _.sortBy(banks.serialize(), ['id']);
  }

  static async getById(id) {
    const bank = await this.where({ id_masterbank: id }).fetch();
    if (!bank) throw new BadRequestError('No bank found');
    return bank;
  }
}

export const Bank = bookshelf.model('Bank', BankModel);
export default { Bank, BankStatus };

