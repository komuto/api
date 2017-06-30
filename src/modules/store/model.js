import moment from 'moment';
import core from '../core';
import '../user/model/user';

const bookshelf = core.postgres.db;

class StoreModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'toko';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_toko';
  }

  /**
   * Add relation to User
   */
  user() {
    return this.belongsTo('User', 'id_users', 'id_users');
  }

  /**
   * Add relation to Product
   */
  products() {
    return this.hasMany('Product');
  }
}

StoreModel.prototype.serialize = function () {
  return {
    id: this.attributes.id_toko,
    user_id: this.attributes.id_users,
    name: this.attributes.nama_toko,
    slogan: this.attributes.slogan_toko,
    description: this.attributes.deskripsi_toko,
    logo: this.attributes.logo_toko,
    custom_domain: this.attributes.custom_domain,
    status: parseInt(this.attributes.status_toko, 10),
    remarks_status: this.attributes.remarks_status_toko,
    cover_image: this.attributes.pathcoverimage_toko,
    seller_theme_id: this.attributes.identifier_themesseller,
    reputation: this.attributes.reputasi_toko,
    store_id_number: this.attributes.no_ktp_toko,
    total_favorite: this.attributes.jumlahfavorit_toko,
    note: this.attributes.note,
    created_at: moment(this.attributes.tgl_create_toko).unix(),
    status_at: moment(this.attributes.tglstatus_toko).unix(),
    verification_at: moment(this.attributes.tanggal_verifikasi).unix(),
    start_at: this.attributes.mulai_tanggal ? moment(this.attributes.mulai_tanggal).unix() : null,
    end_at: this.attributes.sampai_tanggal ? moment(this.attributes.sampai_tanggal).unix() : null,
  };
};

export const Store = bookshelf.model('Store', StoreModel);
export default { Store };
