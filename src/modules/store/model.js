import moment from 'moment';
import core from '../core';
import '../user/model/user';

const input = core.utils.input;
const bookshelf = core.postgres.db;
const IMAGE_PATH = 'toko';

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
  const attr = this.attributes;
  return {
    id: attr.id_toko,
    user_id: attr.id_users,
    name: attr.nama_toko,
    slogan: attr.slogan_toko,
    description: attr.deskripsi_toko,
    logo: core.imagePath(IMAGE_PATH, attr.logo_toko),
    custom_domain: attr.custom_domain,
    status: parseInt(attr.status_toko, 10),
    remarks_status: attr.remarks_status_toko,
    cover_image: input(
      attr.pathcoverimage_toko,
      null,
      core.imagePath(IMAGE_PATH, attr.pathcoverimage_toko)
    ),
    seller_theme_id: attr.identifier_themesseller,
    reputation: attr.reputasi_toko,
    store_id_number: attr.no_ktp_toko,
    total_favorite: attr.jumlahfavorit_toko,
    note: attr.note,
    created_at: moment(attr.tgl_create_toko).unix(),
    status_at: moment(attr.tglstatus_toko).unix(),
    verification_at: moment(attr.tanggal_verifikasi).unix(),
    is_verified: !!attr.sampai_tanggal,
    start_at: input(attr.mulai_tanggal, null, moment(attr.mulai_tanggal).unix()),
    end_at: input(attr.sampai_tanggal, null, moment(attr.sampai_tanggal).unix()),
  };
};

export const Store = bookshelf.model('Store', StoreModel);
export default { Store };
