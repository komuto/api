import _ from 'lodash';
import core from '../../core';

const bookshelf = core.mysql.db;

class ExpeditionModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'list_ekspedisi';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_ekspedisi';
  }

  /**
   * Get expeditions by condition
   * @param {Object} condition
   */
  static async get(condition = null) {
    condition = _.omitBy(condition, _.isNil);
    return await this.where(condition).fetchAll();
  }
}

ExpeditionModel.prototype.serialize = function () {
  return {
    id: this.attributes.id_ekspedisi,
    name: this.attributes.nama_ekspedisi,
    status: this.attributes.status_ekspedisi,
    method: this.attributes.method_ekspedisi,
    status_at: this.attributes.tglstatus_ekspedisi,
    logo: this.attributes.logo_path,
    insurance_fee: this.attributes.asurasi_fee,
  };
};

// eslint-disable-next-line import/prefer-default-export
export const Expedition = ExpeditionModel;
