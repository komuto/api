import core from '../../core';
import { BadRequestError } from '../../../../common/errors';

const bookshelf = core.postgres.db;
const { parseNum } = core.utils;

class ReportModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'pelaporan_produk';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_pelaporanproduk';
  }

  serialize() {
    return {
      id: this.get('id_pelaporanproduk'),
      product_id: this.get('id_produk'),
      user_id: this.get('identifier_pelapor'),
      type: parseNum(this.get('jenis_pelaporanproduk')),
      description: this.get('deskripsi_pelaporanproduk'),
    };
  }

  /**
   * Create report
   */
  static async create(data) {
    return await new this(data).save().catch(() => {
      throw new BadRequestError('Gagal menambah laporan.');
    });
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      product_id: 'id_produk',
      user_id: 'identifier_pelapor',
      type: 'jenis_pelaporanproduk',
      description: 'deskripsi_pelaporanproduk',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop] && data[prop] !== undefined) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const Report = bookshelf.model('Report', ReportModel);
export default { Report };
