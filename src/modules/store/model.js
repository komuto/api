import core from '../core';

const bookshelf = core.postgres.db;

export const StoreStatus = {};

class StoreModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'toko';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_toko';
  }
  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  /**
   * Add relation to user
   */
  user() {
    return this.belongsTo('User');
  }
}

StoreModel.prototype.serialize = function () {
  return {
    id: this.attributes.id_toko,
    name: this.attributes.nama_toko,
    slogan: this.attributes.slogan_toko,
    description: this.attributes.deskripsi_toko,
    logo: this.attributes.logo_toko,
    custom_domain: this.attributes.custom_domain,
    created_at: this.attributes.tgl_create_toko,
    status: this.attributes.status_toko,
    remarks_status: this.attributes.remarks_status_toko,
    status_at: this.attributes.tglstatus_toko,
    cover_image: this.attributes.pathcoverimage_toko,
    seller_theme_id: this.attributes.identifier_themesseller,
    reputation: this.attributes.reputasi_toko,
    store_id_number: this.attributes.no_ktp_toko,
    total_favorite: this.attributes.jumlahfavorit_toko,
    verification_at: this.attributes.tanggal_verifikasi,
    note: this.attributes.note,
    start_at: this.attributes.mulai_tanggal,
    end_at: this.attributes.sampai_tanggal,
  };
};

export const Store = StoreModel;
export default bookshelf.model('Store', StoreModel);
