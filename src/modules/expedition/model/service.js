import _ from 'lodash';
import moment from 'moment';
import core from '../../core';
import './expedition';

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

  expedition() {
    return this.belongsTo('Expedition', 'id_ekspedisi');
  }

  /**
   * Get expeditions by condition
   * @param {Object} condition
   */
  static async get(condition = null) {
    condition = _.omitBy(condition, _.isNil);
    return await this.where(condition).orderBy('id_ekspedisiservice').fetchAll();
  }
}

ServiceModel.prototype.serialize = function (minimal = true) {
  if (minimal) {
    return {
      id: this.attributes.id_ekspedisiservice,
      name: this.attributes.nama_ekspedisiservice,
      description: this.attributes.deskripsi_ekspedisiservice,
      logo: this.attributes.logo_path,
    };
  }
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

export default bookshelf.model('ExpeditionService', ServiceModel);

