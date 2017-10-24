import Cryptorjs from 'cryptorjs';
import config from '../../../../config';
import core from '../../core';
import { getMarketplaceError } from '../messages';

const { parseDate } = core.utils;
const bookshelf = core.postgres.db;

const crypt = new Cryptorjs(config.secretKey);

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

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize({ minimal = false } = {}) {
    const marketplace = {
      mobile_domain: this.get('mobile_domain'),
      api_domain: this.get('api_domain'),
    };
    if (minimal) return marketplace;
    return {
      ...marketplace,
      id: this.get('id_marketplaceuser'),
      marketplace_id: this.get('parentid_marketplace'),
      theme_id: this.get('identifier_themesmp'),
      domain: this.get('domain_marketplace'),
      name: this.get('nama_marketplace'),
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

  static async findByDomain(domain) {
    const marketplace = await this.where({ mobile_domain: domain }).fetch();
    if (!marketplace) throw getMarketplaceError('marketplace', 'not_found');
    return {
      ...marketplace.serialize({ minimal: true }),
      generated_id: crypt.encode({ id: marketplace.get('id_marketplaceuser') }),
    };
  }
}

export const Marketplace = bookshelf.model('Marketplace', MarketplaceModel);
