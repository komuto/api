import moment from 'moment';
import core from '../../core';

const bookshelf = core.postgres.db;
const { parseDate } = core.utils;

export const StoreExpeditionStatus = {
  SELECTED: 1,
  UNSELECTED: 2,
};

class StoreExpeditionModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'detil_ekspedisitoko';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_ekspedisiservice';
  }

  serialize() {
    return {
      store_id: this.get('id_toko'),
      expedition_service_id: this.get('id_ekspedisiservice'),
      status: this.get('status_eskpedisitoko'),
      created_at: parseDate(this.get('tglstatus_ekspedisitoko')),
    };
  }

  initialize() {
    this.on('updating', (model, attrs, options) => {
      const { id_toko, id_ekspedisiservice } = attrs;
      ['id_toko', 'id_ekspedisiservice'].forEach((prop) => {
        model.unset(prop);
        delete attrs[prop];
      });
      options.patch = true;
      options.query.where({ id_toko, id_ekspedisiservice });
    }, this);
  }

  /**
   * Save batch store expedition
   * @param collection {array}
   */
  static async updateBatch(collection) {
    const checker = await Promise.all(collection.map((storeExpedition) => {
      const { id_toko, id_ekspedisiservice } = storeExpedition;
      return new this({ id_toko, id_ekspedisiservice }).fetch({ columns: 'id_toko' });
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
      store_id: 'id_toko',
      status: 'status_ekspedisitoko',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop]) newData[column[prop]] = data[prop];
    });
    if (full) newData.tglstatus_ekspedisitoko = moment();
    return newData;
  }
}

export const StoreExpedition = bookshelf.model('StoreExpedition', StoreExpeditionModel);
export default { StoreExpedition, StoreExpeditionStatus };
