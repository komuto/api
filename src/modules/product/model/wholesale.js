import _ from 'lodash';
import core from '../../core';

const bookshelf = core.postgres.db;

class WholesaleModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'param_grosir';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_paramgrosir';
  }

  serialize() {
    return {
      id: this.get('id_paramgrosir'),
      min: this.get('min_paramgrosir'),
      max: this.get('max_paramgrosir'),
      price: parseFloat(this.get('harga_paramgrosir')),
    };
  }

  /**
   * @param id {integer} product id
   * @param data {array}
   */
  static async createBulk(id, data) {
    const wholesales = data.map(wholesale => new this().save(
      _.assign(this.matchDBColumn(wholesale), { id_produk: id }),
      { method: 'insert' }),
    );
    return await Promise.all(wholesales);
  }

  /**
   * @param id {integer} product id
   * @param data {array}
   */
  static async updateBulk(id, data) {
    let deletes = _.filter(data, o => o.is_deleted);
    let updates = _.filter(data, o => !o.is_deleted === false);
    let newData = _.filter(data, o => o.is_created);

    deletes = deletes.map(val => this.where({ id_paramgrosir: val.id }).destroy());
    updates = updates.map((val) => {
      const wholesale = this.matchDBColumn(val);
      return this.where({ id_paramgrosir: val.id }).save(wholesale, { patch: true });
    });
    newData = newData.map((val) => {
      const wholesale = this.matchDBColumn(val);
      return new this().save(_.assign(wholesale, { id_produk: id }), { method: 'insert' });
    });
    return await Promise.all([...deletes, ...updates, ...newData]).catch(() => {});
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      min_order: 'min_paramgrosir',
      max_order: 'max_paramgrosir',
      price: 'harga_paramgrosir',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop] && data[prop] !== undefined) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const Wholesale = bookshelf.model('Wholesale', WholesaleModel);
export default { Wholesale };
