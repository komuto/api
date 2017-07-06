import moment from 'moment';
import core from '../../core';

const bookshelf = core.postgres.db;
const IMAGE_PATH = 'produk';

class ImageProductModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'gambar_produk';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_gambarproduk';
  }

  /**
   * Add relation to Product
   */
  product() {
    return this.belongsTo('Product', 'id_produk', 'id_produk');
  }
}

ImageProductModel.prototype.serialize = function () {
  return {
    id: this.attributes.id_gambarproduk,
    product_id: this.attributes.id_produk,
    file: core.imagePath(IMAGE_PATH, this.attributes.file_gambarproduk),
    created_at: moment(this.attributes.created_gambarproduk).unix(),
    updated_at: moment(this.attributes.updated_gambarproduk).unix(),
  };
};

export const ImageProduct = bookshelf.model('ImageProduct', ImageProductModel);
export default { ImageProduct };