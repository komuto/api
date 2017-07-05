import moment from 'moment';
import core from '../../core';
import '../../product/model/product';

const bookshelf = core.postgres.db;

class CatalogModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'katalog';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_katalog';
  }

  products() {
    return this.hasMany('Product', 'identifier_katalog');
  }

  static async getUserCatalog(id) {
    const catalogs = await this.query((qb) => {
      qb.select('id_katalog', 'nama_katalog');
      qb.count('produk.* as count_product');
      qb.innerJoin('produk', 'katalog.id_katalog', 'produk.identifier_katalog');
      qb.innerJoin('toko', 'produk.id_toko', 'toko.id_toko');
      qb.where('id_users', id);
      qb.groupBy('id_katalog');
      qb.orderBy('id_katalog');
    }).fetchAll();
    return catalogs;
  }

  static matchDBColumn(data) {
    const column = {
      catalog_id: 'id_katalog',
      store_id: 'id_toko',
      name: 'nama_katalog',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop]) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

CatalogModel.prototype.serialize = function () {
  return {
    id: this.attributes.id_katalog,
    store_id: this.attributes.id_toko,
    name: this.attributes.nama_katalog,
    count_product: this.attributes.count_product ? this.attributes.count_product : undefined,
    created_at: this.attributes.datecreate_katalog ?
      moment(this.attributes.datecreate_katalog).unix() : undefined,
  };
};

export const Catalog = bookshelf.model('Catalog', CatalogModel);
export default { Catalog };
