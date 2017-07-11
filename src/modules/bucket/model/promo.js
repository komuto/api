import moment from 'moment';
import core from '../../core';
import { BadRequestError } from '../../../../common/errors';

const { parseNum, parseDate } = core.utils;

const bookshelf = core.postgres.db;

class PromoModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'promo';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_promo';
  }

  /**
   * Get promo
   */
  static async get(code) {
    let promo = await this.where({ kode_promo: code }).fetch();
    if (!promo) throw new BadRequestError('Code promo tidak ditemukan');
    promo = promo.serialize();
    const isValid = moment().isBetween(moment.unix(promo.start_at), moment.unix(promo.expired_at));
    if (!isValid) throw new BadRequestError('Code promo sudah tidak valid');
    return promo;
  }
}

PromoModel.prototype.serialize = function () {
  return {
    id: this.attributes.id_promo,
    marketplace_user_id: this.attributes.id_marketplaceuser,
    promo_code: this.attributes.kode_promo,
    type: parseNum(this.attributes.jenis_promo),
    percentage: this.attributes.persentase_promo,
    nominal: parseNum(this.attributes.nominal_promo),
    start_at: parseDate(this.attributes.startdate_promo),
    expired_at: parseDate(this.attributes.expdate_promo),
    status: parseNum(this.attributes.status_promo),
    status_at: parseDate(this.attributes.tglstatus_promo),
  };
};

export const Promo = bookshelf.model('Promo', PromoModel);
export default { Promo };
