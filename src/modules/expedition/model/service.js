import _ from 'lodash';
import moment from 'moment';
import core from '../../core';

const bookshelf = core.postgres.db;

class ServiceModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'ekspedisi_service';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_ekspedisiservice';
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

ServiceModel.prototype.serialize = function () {
  return {
    id: this.attributes.id_ekspedisiservice,
    expedition_id: this.attributes.id_ekspedisi,
    name: this.attributes.nama_ekspedisiservice,
    description: this.attributes.deskripsi_ekspedisiservice,
    status: parseInt(this.attributes.status_ekspedisiservice, 10),
    status_at: moment(this.attributes.tglstatus_ekspedisiservice).unix(),
    logo: this.attributes.logo_path,
  };
};

// eslint-disable-next-line import/prefer-default-export
export const ExpeditionService = ServiceModel;
