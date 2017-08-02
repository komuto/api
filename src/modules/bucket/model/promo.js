import moment from 'moment';
import core from '../../core';
import { getPromoError } from './../messages';

const { parseNum, parseDate } = core.utils;
const bookshelf = core.postgres.db;

export const PromoStatus = {
  SHOW: 1,
  HIDE: 2,
};

export const PromoType = {
  PERCENTAGE: 0,
  NOMINAL: 1,
};

class PromoModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'promo';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_promo';
  }

  serialize() {
    return {
      id: this.get('id_promo'),
      marketplace_user_id: this.get('id_marketplaceuser'),
      promo_code: this.get('kode_promo'),
      type: parseNum(this.get('jenis_promo')),
      percentage: this.get('persentase_promo'),
      nominal: parseNum(this.get('nominal_promo')),
      start_at: parseDate(this.get('startdate_promo')),
      expired_at: parseDate(this.get('expdate_promo')),
      status: parseNum(this.get('status_promo')),
      status_at: parseDate(this.get('tglstatus_promo')),
    };
  }

  /**
   * Get promo
   */
  static async get(code) {
    const promo = await this.query((qb) => {
      qb.whereRaw('LOWER(kode_promo) LIKE ?', `%${code.toLowerCase()}%`);
      qb.where('expdate_promo', '>=', moment());
    }).fetch();
    if (!promo) throw getPromoError('promo', 'not_found');
    return promo;
  }
}

export const Promo = bookshelf.model('Promo', PromoModel);
export default { Promo, PromoStatus, PromoType };
