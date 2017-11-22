import _ from 'lodash';
import core from '../../core';
import config from '../../../../config';
import { BadRequestError } from '../../../../common/errors';

const { parseNum, parseDate } = core.utils;
const bookshelf = core.postgres.db;
const IMAGE_PATH = config.imageFolder.bank;

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

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize({ minimal = false } = {}, domain) {
    const bank = {
      id: this.get('id_masterbank'),
      name: this.get('nama_masterbank'),
    };
    if (minimal) return bank;
    return {
      ...bank,
      code: this.get('kode_masterbank'),
      status: parseNum(this.get('status_masterbank')),
      status_at: parseDate(this.get('tglstatus_masterbank')),
      logo: core.imagePath(domain, IMAGE_PATH, this.get('logo_masterbank'), 'img'),
    };
  }

  /**
   * Get all banks
   */
  static async getAll(domain) {
    let banks = await this.where({}).fetchAll();
    if (!banks) throw new BadRequestError('No banks found');
    banks = banks.map(o => o.serialize({}, domain));
    return _.sortBy(banks, ['id']);
  }

  static async getById(id) {
    const bank = await this.where({ id_masterbank: id }).fetch();
    if (!bank) throw new BadRequestError('No bank found');
    return bank;
  }
}

export const Bank = bookshelf.model('Bank', BankModel);

