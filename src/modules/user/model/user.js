import bcrypt from 'bcrypt';
import moment from 'moment';
import rp from 'request-promise';
import config from '../../../../config';
import core from '../../core';
import '../../store/model';
import { Product } from '../../product/model';

const bookshelf = core.postgres.db;

// used by bcrypt to generate new salt
// 8 rounds will produce about 40 hashes per second on a 2GHz core
// see: https://www.npmjs.com/package/bcrypt
const SALT_ROUND = 8;

export const UserRoles = {
  ROLE_ADMIN: 'admin',
  ROLE_USER: 'user',
};

export const UserStatus = {
  INACTIVE: '0',
  ACTIVE: '1',
  TEMPBANNED: '2',
  PERMABANNED: '3',
};

class UserModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'users';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_users';
  }

  /**
   * Add relation to Store
   */
  store() {
    return this.hasOne('Store', 'id_users', 'id_users');
  }

  /**
   * Add relation to Address
   */
  addresses() {
    return this.hasMany('Address', 'id_users', 'id_users');
  }

  /**
   * Add relation to Product
   */
  wishlist() {
    return this.belongsToMany('Product', 'wishlist', 'id_users', 'id_produk');
  }

  /**
   * Create password hash from plain text
   * @param {string} str
   */
  static async hashPassword(str) {
    return await bcrypt.hash(str, SALT_ROUND);
  }

  /**
   * Create password hash from plain text synchronously
   * @param {string} str
   */
  static hashPasswordSync(str) {
    return bcrypt.hashSync(str, SALT_ROUND);
  }

  /**
   * Create a new user with callback
   * @param {Object} data
   */
  static async create(data) {
    data.approval_koperasi_users = 0;
    data.tgl_create_users = moment();
    data.status_users = 0;
    data.tglstatus_users = moment();
    const user = await new this(data).save();
    return user.serialize();
  }

  /**
   * Update user
   * @param {Object} data
   * @param {Object} newData
   * @return {Object} user updated field only
   */
  static async update(data, newData) {
    await this.where(data).save(newData, { patch: true });
  }

  /**
   * Activate user by changing its status
   * @param {number} id
   */
  static async activate(id) {
    await this.where({ id_users: id }).save({ status_users: '1' }, { patch: true });
  }

  static async getById(id) {
    return await new this({ id_users: id }).fetch();
  }

  static async getByEmail(email) {
    const user = await new this({ email_users: email }).fetch();
    return user ? user.serialize() : user;
  }

  static async getBySocial(name, uid) {
    const user = await new this({
      hybridauth_provider_name: name,
      hybridauth_provider_uid: uid,
    }).fetch();
    return user ? user.serialize() : user;
  }

  static async getProfile(id) {
    const user = await this.where('id_users', id).fetch({ withRelated: ['store'] });
    const store = user.related('store');
    return { user, store };
  }

  static async getWishlist(id) {
    const user = await this.where('id_users', id).fetch({ withRelated: ['wishlist'] });
    const productIds = user.related('wishlist').map(product => product.toJSON().id);
    const products = await Product.query((qb) => {
      qb.whereIn('id_produk', productIds);
    }).fetchAll({ withRelated: ['store', 'imageProducts'] });

    return products.map((product) => {
      const store = product.related('store');
      const imageProducts = product.related('imageProducts');
      return { product, store, imageProducts };
    });
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      name: 'namalengkap_users',
      email: 'email_users',
      password: 'password_users',
      cooperative_member_number: 'no_anggotakoperasi_users',
      approval_cooperative_status: 'approval_koperasi_users',
      photo: 'pathfoto_users',
      phone_number: 'nohp_users',
      gender: 'jeniskelamin_users',
      status: 'status_users',
      mother_name: 'ibukandung_users',
      saldo_wallet: 'saldo_wallet',
      place_of_birth: 'kota_lahir',
      date_of_birth: 'tgl_lahir',
      provider_name: 'hybridauth_provider_name',
      provider_uid: 'hybridauth_provider_uid',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop]) newData[column[prop]] = data[prop];
    });
    return newData;
  }

  /**
   * Compare plain password with it's hashed password
   * @param {string} plain
   * @return {bool}
   */
  checkPassword(plain) {
    return bcrypt.compareSync(plain, this.get('password_users'));
  }

  /**
   * Compare plain password with it's hashed password from komuto api
   * @param {string} plain
   * @return {bool}
   */
  async checkPasswordFromApi(plain) {
    return await rp.post({
      url: config.komutoUrl,
      form: {
        page: 'login',
        function: 'validatepassword',
        param: {
          password: plain,
          hash: this.get('password_users'),
        },
      },
    });
  }
}

UserModel.prototype.serialize = function () {
  return {
    id: this.attributes.id_users,
    marketplace_id: this.attributes.marketplaceuser ? this.attributes.marketplaceuser : null,
    name: this.attributes.namalengkap_users,
    email: this.attributes.email_users,
    cooperative_member_number: this.attributes.no_anggotakoperasi_users ?
      this.attributes.no_anggotakoperasi_users : null,
    approval_cooperative_status: this.attributes.approval_koperasi_users,
    photo: this.attributes.pathfoto_users ? this.attributes.pathfoto_users : null,
    phone_number: this.attributes.nohp_users ? this.attributes.nohp_users : null,
    gender: this.attributes.jeniskelamin_users === 'L' ? 'male' : 'female',
    status: parseInt(this.attributes.status_users, 10),
    mother_name: this.attributes.ibukandung_users ? this.attributes.ibukandung_users : null,
    auth_key: this.attributes.auth_key ? this.attributes.auth_key : null,
    saldo_wallet: this.attributes.saldo_wallet ? this.attributes.saldo_wallet : 0,
    place_of_birth: this.attributes.kota_lahir ? this.attributes.kota_lahir : null,
    date_of_birth: this.attributes.tgl_lahir ? this.attributes.tgl_lahir : null,
    created_at: moment(this.attributes.tgl_create_users).unix(),
    join_at: this.attributes.tgl_join_koperasi ? this.attributes.tgl_join_koperasi : null,
    status_at: moment(this.attributes.tglstatus_users).unix(),
    provider_name: this.attributes.hybridauth_provider_name,
    provider_uid: this.attributes.hybridauth_provider_uid,
  };
};

export const User = bookshelf.model('User', UserModel);
export default { User, UserStatus, UserRoles };
