import core from '../../core';

const bookshelf = core.postgres.db;

class ImageGroupModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'image_group';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_image';
  }

  serialize() {
    return {
      id: this.get('id_image'),
      parent_id: this.get('parent_id'),
      image: this.get('image'),
      group: this.get('group'),
    };
  }

  static async bulkCreate(id, images, group = 'resolusi') {
    return await Promise.all(images.map(async image => await new this({
      parent_id: id,
      image: image.name,
      group,
    }).save()));
  }
}

export const ImageGroup = bookshelf.model('ImageGroup', ImageGroupModel);
export default { ImageGroup };
