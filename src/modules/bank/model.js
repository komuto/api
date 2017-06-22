import moment from 'moment';
import _ from 'lodash';
import core from '../core';
import { BadRequestError } from '../../../common/errors';

const bookshelf = core.postgres.db;

class BankModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'master_bank';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_masterbank';
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

BankModel.prototype.serialize = function () {
  return {
    id: this.attributes.id_masterbank,
    name: this.attributes.nama_masterbank,
    code: this.attributes.kode_masterbank,
    status: this.attributes.status_masterbank,
    status_at: moment(this.attributes.tglstatus_masterbank).unix(),
    logo: this.attributes.logo_masterbank,
  };
};

export default bookshelf.model('Bank', BankModel);

