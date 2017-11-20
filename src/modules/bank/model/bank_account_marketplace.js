import core from '../../core';
import config from '../../../../config';

const { parseNum } = core.utils;
const bookshelf = core.postgres.db;
const IMAGE_PATH = config.imageFolder.bank;

export const BankAccountMarketplaceStatus = {
  NOT_PRIMARY: 0,
  PRIMARY: 1,
};

class BankAccountMarketplaceModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'rekening_mp';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_rekeningmp';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize() {
    return {
      id: this.get('id_rekeningmp'),
      marketplace_id: this.get('id_marketplaceuser'),
      user_id: this.get('id_users'),
      bank_name: this.get('nama_bankrekeningmp'),
      holder_name: this.get('nama_pemilikrekeningmp'),
      holder_account_number: this.get('nomor_rekening_mp'),
      bank_branch_office_name: this.get('cabang_bankrekeningusermp'),
      is_primary: parseNum(this.get('primary_rekeningmp')) === BankAccountMarketplaceStatus.PRIMARY,
      logo: core.imagePath(IMAGE_PATH, this.get('logo_bank')),
    };
  }
}

export const BankAccountMarketplace = bookshelf.model('BankAccountMarketplace', BankAccountMarketplaceModel);
