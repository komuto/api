import _ from 'lodash';
import moment from 'moment';
import core from '../../core';

const bookshelf = core.postgres.db;

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
    method: this.attributes.method_ekspedisi,
    logo: this.attributes.logo_path,
    insurance_fee: parseFloat(this.attributes.asurasi_fee),
    status: parseInt(this.attributes.status_ekspedisi, 10),
    status_at: moment(this.attributes.tglstatus_ekspedisi).unix(),
  };
};

export const Expedition = ExpeditionModel;
export default bookshelf.model('Expedition', ExpeditionModel);
