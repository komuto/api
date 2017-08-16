import moment from 'moment';
import core from '../../core';

const bookshelf = core.postgres.db;

export const ExpeditionProductStatus = {
  USED: 1,
  UNUSED: 2,
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

  initialize() {
    this.on('updating', (model, attrs, options) => {
      const { id_produk, id_ekspedisiservice } = attrs;
      ['id_produk', 'id_ekspedisiservice'].forEach((prop) => {
        model.unset(prop);
        delete attrs[prop];
      });
      options.patch = true;
      options.query.where({ id_produk, id_ekspedisiservice });
    }, this);
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

  /**
   * @param id {integer} product id
   * @param data {array}
   */
  static async updateBulk(id, data) {
    const collection = data.map((val) => {
      val.product_id = id;
      return this.matchDBColumn(val, true);
    });
    return await this.updateBatch(collection);
  }

  /**
   * Save batch product expedition
   * @param collection {array}
   */
  static async updateBatch(collection) {
    const checker = await Promise.all(collection.map((productExpedition) => {
      const { id_produk, id_ekspedisiservice } = productExpedition;
      return new this({ id_produk, id_ekspedisiservice }).fetch({ columns: 'id_produk' });
    }));
    return await Promise.all(Object.keys(checker).map((key) => {
      let method;
      if (checker[key]) method = 'update';
      else method = 'insert';
      return new this().save(collection[key], { method });
    }));
  }

  static matchDBColumn(data, full = false) {
    const column = {
      expedition_service_id: 'id_ekspedisiservice',
      product_id: 'id_produk',
      status: 'status_detilekspedisiproduk',
    };
    const newData = {};
    if (full) newData.tglstatus_detilekspedisiproduk = moment();
    Object.keys(data).forEach((prop) => {
      if (column[prop]) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const ExpeditionProduct = bookshelf.model('ExpeditionProduct', ExpeditionProductModel);
