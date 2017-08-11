import core from '../../core';

const { parseDate } = core.utils;
const bookshelf = core.postgres.db;

export const MarketplaceStatus = {
  INACTIVE: 0,
  ACTIVE: 1,
};

class MarketplaceModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'marketplace_users';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_marketplaceuser';
  }

  serialize() {
    return {
      id: this.get('id_marketplaceuser'),
      marketplace_id: this.get('parentid_marketplace'),
      theme_id: this.get('identifier_themesmp'),
      domain: this.get('domain_marketplaceuser'),
      name: this.get('nama_marketplaceuser'),
      email: this.get('email_marketplaceuser'),
      phone_number: this.get('no_telepon'),
      saldo_wallet: this.get('saldo_wallet'),
      logo: this.get('logo_marketplace'),
      favicon: this.get('favicon_pathmp'),
      status: this.get('status_marketplaceuser'),
      status_at: this.get('tgltatus_marketplaceuser'),
      is_cooperative: this.get('add_koperasi'),
      cooperative_created_at: parseDate(this.get('datecreated_marketplaceuser')),
    };
  }

  static async findById(id) {
    return await this.where({ id_marketplaceuser: id }).fetch();
  }
}

export const Marketplace = bookshelf.model('Marketplace', MarketplaceModel);
