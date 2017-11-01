import moment from 'moment';
import fs from 'fs';
import core from '../../core';
import config from '../../../../config';

const bookshelf = core.postgres.db;
const IMAGE_PATH = config.imageFolder.product;

class ImageProductModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'gambar_produk';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_gambarproduk';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  initialize() {
    // Set order by to always based on id_gambarproduk asc when fetching
    this.on('fetching', (model, columns, options) => {
      options.query.orderBy('id_gambarproduk');
    }, this);
  }

  serialize() {
    return {
      id: this.get('id_gambarproduk'),
      product_id: this.get('id_produk'),
      file: core.imagePath(IMAGE_PATH, this.get('file_gambarproduk')),
      file_name: this.get('file_gambarproduk'),
      created_at: moment(this.get('created_gambarproduk')).unix(),
      updated_at: moment(this.get('updated_gambarproduk')).unix(),
    };
  }

  /**
   * Add relation to Product
   */
  product() {
    return this.belongsTo('Product', 'id_produk', 'id_produk');
  }

  /**
   * @param id {integer} product id
   * @param data {array}
   */
  static async createBulk(id, data) {
    const date = moment().toDate();
    const images = data.map(file => new this().save({
      id_produk: id,
      file_gambarproduk: file.name,
      created_gambarproduk: date,
      updated_gambarproduk: date,
    }, { method: 'insert' }));
    return await Promise.all(images);
  }

  /**
   * @param id {integer} product id
   */
  static async deleteBulk(id) {
    let images = await this.where({ id_produk: id }).fetchAll();
    images = images.map((val) => {
      const path = `${config.imagePath}/${config.imageFolder.product}/${val.get('file_gambarproduk')}`;
      fs.unlink(path, () => {});
      return val.destroy();
    });
    return await Promise.all(images);
  }
}

export const ImageProduct = bookshelf.model('ImageProduct', ImageProductModel);
export default { ImageProduct };
