import core from '../../core';
import { createReportError } from './../messages';

const bookshelf = core.postgres.db;
const { parseNum } = core.utils;

export const ReportType = {
  WRONG_CATEGORY: 1,
  ADVERTISEMENT: 2,
  PORNOGRAPHY: 3,
  BRAND: 4,
  OTHER: 5,
};

export const ReportTypeWord = (type) => {
  let word = null;
  switch (type) {
    case ReportType.WRONG_CATEGORY:
      word = 'Salah Kategori';
      break;
    case ReportType.ADVERTISEMENT:
      word = 'Iklan Situs Luar';
      break;
    case ReportType.PORNOGRAPHY:
      word = 'Pornografi';
      break;
    case ReportType.BRAND:
      word = 'Pelanggaran Merk Dagang';
      break;
    case ReportType.OTHER:
      word = 'Lainnya';
      break;
    default:
      break;
  }
  return word;
};

class ReportModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'pelaporan_produk';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_pelaporanproduk';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize() {
    return {
      id: this.get('id_pelaporanproduk'),
      product_id: parseNum(this.get('id_produk')),
      user_id: this.get('identifier_pelapor'),
      type: parseNum(this.get('jenis_pelaporanproduk')),
      description: this.get('deskripsi_pelaporanproduk'),
    };
  }

  /**
   * Create report
   */
  static create(data) {
    return new this(data).save().catch(() => {
      throw createReportError('report', 'error');
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
export default { Report, ReportType, ReportTypeWord };
