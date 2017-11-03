import core from '../../core';
import config from '../../../../config';

const { parseDate, parseNum } = core.utils;
const bookshelf = core.postgres.db;
const IMAGE_PATH = config.imageFolder.banner;

export const BannerStatus = {
  INACTIVE: 0,
  ACTIVE: 1,
};

class BannerModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'main_banner';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_mainbanner';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize() {
    return {
      id: this.get('id_mainbanner'),
      marketplace_id: this.get('id_marketplaceuser'),
      position: this.get('posisi_mainbanner'),
      image: core.imagePath(IMAGE_PATH, this.get('path_mainbanner')),
      link: this.get('link_mainbanner'),
      label: this.get('label_mainbanner'),
      value: this.get('value_mainbanner'),
      status: parseNum(this.get('status_mainbanner')),
      status_at: parseDate(this.get('tglstatus_mainbanner')),
      created_at: parseDate(this.get('datecreated_mainbanner')),
    };
  }

  static findByMarketplaceId(marketplaceId) {
    return this.where({
      id_marketplaceuser: marketplaceId,
      status_mainbanner: BannerStatus.ACTIVE,
    }).fetchAll();
  }
}

export const Banner = bookshelf.model('Banner', BannerModel);
