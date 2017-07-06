import _ from 'lodash';
import moment from 'moment';
import rp from 'request-promise';
import core from '../../core';
import './expedition_service';
import { BadRequestError } from '../../../../common/errors';

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

  static async getServices() {
    const expeditions = await this.where({}).fetchAll({ withRelated: ['services'] });
    return expeditions.map((expedition) => {
      const services = expedition.related('services').map((service) => {
        service = service.serialize();
        service.full_name = `${expedition.toJSON().name} ${service.name}`;
        return service;
      });
      return {
        ...expedition.serialize(true),
        services,
      };
    });
  }

  /**
   * Get expedition cost
   */
  static async getCost(id, body) {
    const expedition = await this.where({ id_ekspedisi: id }).fetch({ withRelated: ['services'] });
    if (!expedition) throw new BadRequestError('No expedition found');
    const services = expedition.related('services').toJSON();

    return await rp.post({
      url: 'http://pro.rajaongkir.com/api/cost',
      form: {
        origin: body.origin_ro_id,
        originType: 'city',
        destination: body.destination_ro_id,
        destinationType: 'city',
        weight: body.weight,
        courier: expedition.toJSON().name.toLowerCase(),
      },
      headers: {
        key: '78b9624fc632fd9923625b297a3f7035',
      },
    })
      .then((res) => {
        const result = JSON.parse(res).rajaongkir.results[0];
        const results = [];

        _.forEach(result.costs.reverse(), (cost) => {
          const found = _.find(services, { name: cost.service });
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
      })
      .catch(() => {
        throw new BadRequestError('No expedition cost found');
      });
  }
}

ExpeditionModel.prototype.serialize = function (minimal = false) {
  if (minimal) {
    return {
      id: this.attributes.id_ekspedisi,
      name: this.attributes.nama_ekspedisi,
      logo: this.attributes.logo_path,
      insurance_fee: parseFloat(this.attributes.asurasi_fee),
    };
  }
  return {
    id: this.attributes.id_ekspedisi,
    name: this.attributes.nama_ekspedisi,
    status: parseInt(this.attributes.status_ekspedisi, 10),
    method: this.attributes.method_ekspedisi,
    status_at: moment(this.attributes.tglstatus_ekspedisi).unix(),
    logo: this.attributes.logo_path,
    insurance_fee: parseFloat(this.attributes.asurasi_fee),
  };
};

export default bookshelf.model('Expedition', ExpeditionModel);
