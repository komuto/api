import moment from 'moment';
import core from '../../core';

const bookshelf = core.postgres.db;

class StoreExpeditionModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'detil_ekspedisitoko';
  }

  /**
   * Save batch store expedition
   * @param collection {array}
   */
  static async createBatch(collection) {
    await new this(collection).invokeThen('save');
  }

  static async update(data, newData) {
    await this.where(data).save(newData, { patch: true });
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
    status: this.attributes.id_toko,
    created_at: moment(this.attributes.tglstatus_ekspedisitoko).unix(),
  };
}

export const StoreExpedition = bookshelf.model('StoreExpedition', StoreExpeditionModel);
export default { StoreExpedition };
