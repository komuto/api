import moment from 'moment';
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

  serialize() {
    return {
      id: this.get('id_gambarproduk'),
      product_id: this.get('id_produk'),
      file: core.imagePath(IMAGE_PATH, this.get('file_gambarproduk')),
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
}

export const ImageProduct = bookshelf.model('ImageProduct', ImageProductModel);
export default { ImageProduct };
