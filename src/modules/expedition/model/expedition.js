import _ from 'lodash';
import rp from 'request-promise-native';
import core from '../../core';
import { getExpeditionError } from './../messages';

const bookshelf = core.postgres.db;
const { parseNum, parseDate } = core.utils;

class ExpeditionModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'list_ekspedisi';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_ekspedisi';
  }

  serialize({ minimal = false } = {}) {
    const expedition = {
      id: this.get('id_ekspedisi'),
      name: this.get('nama_ekspedisi'),
      logo: core.expeditionPath(this.get('logo_path')),
      insurance_fee: parseFloat(this.get('asurasi_fee')),
      is_checked: false,
    };
    if (minimal) return expedition;
    return {
      ...expedition,
      status: parseNum(this.get('status_ekspedisi')),
      method: parseNum(this.get('method_ekspedisi')),
      status_at: parseDate(this.get('tglstatus_ekspedisi')),
    };
  }

  services() {
    return this.hasMany('ExpeditionService', 'id_ekspedisi');
  }

  /**
   * Get expeditions by condition
   * @param {Object} condition
   */
  static async get(condition = null) {
    condition = _.omitBy(condition, _.isNil);
    return await this.where(condition).fetchAll();
  }

  /**
   * Get expedition by id
   * @param {number} id
   */
  static async findById(id) {
    const expedition = await this.where({ id_ekspedisi: id }).fetch();
    if (expedition) return expedition.toJSON();
    throw getExpeditionError('expedition', 'not_found');
  }

  static async getAllServices() {
    const expeditions = await this.where({}).fetchAll({ withRelated: ['services'] });
    return expeditions.map((expedition) => {
      const services = expedition.related('services').map((service) => {
        service = service.serialize({ minimal: false });
        service.full_name = `${expedition.toJSON().name} ${service.name}`;
        return service;
      });
      return {
        ...expedition.serialize({ minimal: true }),
        services,
      };
    });
  }

  /**
   * Get services
   */
  static async getExpeditionNameAndServices(id) {
    const expedition = await this.where({ id_ekspedisi: id }).fetch({ withRelated: ['services'] });
    if (!expedition) throw getExpeditionError('expedition', 'not_found');
    return {
      expedition: expedition.toJSON().name,
      services: expedition.related('services').toJSON(),
    };
  }

  /**
   * Get services by expedition id and service name
   */
  static async getServiceByServiceName(id, serviceName) {
    const expedition = await this.where({ id_ekspedisi: id }).fetch({
      withRelated: [{ services: qb => (qb.where('nama_ekspedisiservice', serviceName)) }],
    });
    if (!expedition) throw getExpeditionError('expedition', 'not_found');
    return {
      expedition: expedition.toJSON().name,
      services: expedition.related('services').toJSON(),
    };
  }

  /**
   * Get expedition cost
   */
  static async getCost(expeditionName, services, query) {
    const res = await rp.post({
      url: 'http://pro.rajaongkir.com/api/cost',
      form: {
        origin: query.origin_ro_id,
        originType: 'city',
        destination: query.destination_ro_id,
        destinationType: 'city',
        weight: query.weight,
        courier: expeditionName.toLowerCase(),
      },
      headers: {
        key: '78b9624fc632fd9923625b297a3f7035',
      },
    }).catch(() => ([]));

    if (!res.length) return [];

    const result = JSON.parse(res).rajaongkir.results[0];
    const results = [];
    _.forEach(result.costs.reverse(), (cost) => {
      const found = _.find(services, (o) => {
        cost.service = this.matchCityCourier(cost.service);
        return o.name === cost.service;
      });
      if (found !== undefined) {
        results.push({
          id: found.id,
          name: found.name,
          full_name: `${result.code.toUpperCase()} ${cost.service}`,
          description: cost.description,
          cost: cost.cost[0].value,
          etd: cost.cost[0].etd,
        });
      }
    });
    return results;
  }

  static matchCityCourier(service) {
    switch (service) {
      case 'CTC':
        return 'REG';
      case 'CTCYES':
        return 'YES';
      case 'CTCOKE':
        return 'OKE';
      default:
        return service;
    }
  }
}

export const Expedition = bookshelf.model('Expedition', ExpeditionModel);
export default { Expedition };
