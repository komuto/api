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
}

export const Wholesale = bookshelf.model('Wholesale', WholesaleModel);
export default { Wholesale };
