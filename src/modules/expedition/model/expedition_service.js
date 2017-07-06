import _ from 'lodash';
import core from '../../core';
import './expedition';

const bookshelf = core.postgres.db;
const { parseNum, parseDate } = core.utils;

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
   * Add relation to Store
   */
  store() {
    return this.belongsToMany('Store', 'detil_ekspedisitoko', 'id_ekspedisiservice', 'id_toko');
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
      is_checked: false,
    };
  }
  return {
    id: this.attributes.id_ekspedisiservice,
    expedition_id: this.attributes.id_ekspedisi,
    name: this.attributes.nama_ekspedisiservice,
    description: this.attributes.deskripsi_ekspedisiservice,
    status: parseNum(this.attributes.status_ekspedisiservice),
    status_at: parseDate(this.attributes.tglstatus_ekspedisiservice),
    logo: this.attributes.logo_path,
  };
};

export default bookshelf.model('ExpeditionService', ServiceModel);

