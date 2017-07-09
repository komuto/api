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
}

WholesaleModel.prototype.serialize = function () {
  return {
    id: this.attributes.id_paramgrosir,
    min: this.attributes.min_paramgrosir,
    max: this.attributes.max_paramgrosir,
    price: parseFloat(this.attributes.harga_paramgrosir),
  };
};

export const Wholesale = bookshelf.model('Wholesale', WholesaleModel);
export default { Wholesale };
