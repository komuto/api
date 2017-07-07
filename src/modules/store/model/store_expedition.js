import moment from 'moment';
import core from '../../core';

const bookshelf = core.postgres.db;
const { parseDate } = core.utils;

class StoreExpeditionModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'detil_ekspedisitoko';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_ekspedisiservice';
  }

  /**
   * Save batch store expedition
   * @param collection {array}
   */
  static async updateBatch(collection) {
    let counter = -1;
    const checker = await Promise.all(collection.map((storeExpedition) => {
      const { id_toko, id_ekspedisiservice } = storeExpedition;
      return new this({ id_toko, id_ekspedisiservice }).fetch();
    }));
    return await Promise.all(collection.map((storeExpedition) => {
      counter += 1;
      const { id_toko, id_ekspedisiservice } = storeExpedition;
      if (checker[counter]) {
        const { status_ekspedisitoko, tglstatus_ekspedisitoko } = storeExpedition;
        return this.where({ id_toko, id_ekspedisiservice }).save({
          status_ekspedisitoko,
          tglstatus_ekspedisitoko },
          { patch: true });
      }
      return new this().save(storeExpedition);
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

StoreExpeditionModel.prototype.serialize = function () {
  return {
    store_id: this.attributes.id_toko,
    expedition_service_id: this.attributes.id_ekspedisiservice,
    status: this.attributes.status_eskpedisitoko,
    created_at: parseDate(this.attributes.tglstatus_ekspedisitoko),
  };
};

export const StoreExpedition = bookshelf.model('StoreExpedition', StoreExpeditionModel);
export default { StoreExpedition };
