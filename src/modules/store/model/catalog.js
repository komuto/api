import core from '../../core';

const bookshelf = core.postgres.db;
const { parseDate, defaultNull } = core.utils;

class CatalogModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'katalog';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_katalog';
  }

  serialize() {
    return {
      id: this.get('id_katalog'),
      store_id: this.get('id_toko'),
      name: this.get('nama_katalog'),
      count_product: defaultNull(this.get('count_product')),
      created_at: parseDate(this.get('datecreate_katalog')),
    };
  }

  products() {
    return this.hasMany('Product', 'identifier_katalog');
  }

  static async getUserCatalog(id) {
    return await this.query((qb) => {
      qb.select('id_katalog', 'nama_katalog');
      qb.count('produk.* as count_product');
      qb.innerJoin('produk', 'katalog.id_katalog', 'produk.identifier_katalog');
      qb.innerJoin('toko', 'produk.id_toko', 'toko.id_toko');
      qb.where('id_users', id);
      qb.groupBy('id_katalog');
      qb.orderBy('id_katalog');
    }).fetchAll();
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

export const Catalog = bookshelf.model('Catalog', CatalogModel);
export default { Catalog };
