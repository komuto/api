import core from '../../core';
import config from '../../../../config';

const bookshelf = core.postgres.db;

const getImage = (group, image) => {
  let path;
  switch (group) {
    case 'resolusi':
      path = config.imageFolder.resolution;
      break;
    case 'dispute':
      path = config.imageFolder.dispute;
      break;
    default:
      break;
  }
  return core.imagePath(path, image);
};

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
      image: getImage(this.get('group'), this.get('image')),
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
