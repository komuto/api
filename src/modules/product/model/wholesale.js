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
    const wholesales = data.map(wholesale => new this().save({
      id_produk: id,
      min_paramgrosir: wholesale.min_order,
      max_paramgrosir: wholesale.max_order,
      harga_paramgrosir: wholesale.price,
    }, { method: 'insert' }));
    return await Promise.all(wholesales);
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
