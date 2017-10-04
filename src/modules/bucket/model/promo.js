import moment from 'moment';
import core from '../../core';
import { addPromoError } from './../messages';
import { BucketStatus } from './bucket';

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
      marketplace_id: this.get('id_marketplaceuser'),
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
   * @param code {string} promo code
   * @param id {int} marketplace id
   */
  static async get(code, id) {
    const promo = await this.query((qb) => {
      qb.where('kode_promo', code);
      qb.where('id_marketplaceuser', id);
      qb.where('kuota_promo', '>', 0);
      qb.where('expdate_promo', '>=', moment());
    }).fetch();
    if (!promo) throw addPromoError('promo', 'not_found');
    return promo;
  }
}

export const Promo = bookshelf.model('Promo', PromoModel);
export default { Promo, PromoStatus, PromoType };
