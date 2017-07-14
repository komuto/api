import _ from 'lodash';
import core from '../../core';

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

  serialize({ minimal = true }) {
    const service = {
      id: this.get('id_ekspedisiservice'),
      name: this.get('nama_ekspedisiservice'),
      description: this.get('deskripsi_ekspedisiservice'),
      logo: this.get('logo_path'),
      is_checked: false,
    };
    if (minimal) {
      return { ...service,
        expedition: this.relations.expedition ? this.related('expedition') : undefined };
    }
    return {
      ...service,
      expedition_id: this.get('id_ekspedisi'),
      status: parseNum(this.get('status_ekspedisiservice')),
      status_at: parseDate(this.get('tglstatus_ekspedisiservice')),
    };
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

export default bookshelf.model('ExpeditionService', ServiceModel);

