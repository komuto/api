import moment from 'moment';
import core from '../../core';

const bookshelf = core.postgres.db;

const ExpeditionProductStatus = {
  USED: '1',
  UNUSED: '2',
};

class ExpeditionProductModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'detil_ekspedisiproduk';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_produk';
  }

  /**
   * @param id {integer} product id
   * @param data {array}
   */
  static async createBulk(id, data) {
    const date = moment();
    const expeditions = data.map(expedition => new this().save({
      id_produk: id,
      id_ekspedisiservice: expedition.expedition_service_id,
      status_detilekspedisiproduk: ExpeditionProductStatus.USED,
      tglstatus_detilekspedisiproduk: date,
    }, { method: 'insert' }));
    return await Promise.all(expeditions);
  }
}

export const ExpeditionProduct = bookshelf.model('ExpeditionProduct', ExpeditionProductModel);
export default { ExpeditionProduct };
