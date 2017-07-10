import bcrypt from 'bcrypt';
import moment from 'moment';
import toTitleCase from 'to-title-case';
import rp from 'request-promise-native';
import config from '../../../../config';
import core from '../../core';
import { model } from '../../address';

const { defaultNull, checkNull, parseDate } = core.utils;
const bookshelf = core.postgres.db;
const { District } = model;

// used by bcrypt to generate new salt
// 8 rounds will produce about 40 hashes per second on a 2GHz core
// see: https://www.npmjs.com/package/bcrypt
const SALT_ROUND = 8;
const IMAGE_PATH = 'user';

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
  wishlistProducts() {
    return this.hasMany('Product', 'id_users').through('Wishlist', 'id_produk', 'id_users', 'id_produk');
  }

  birthPlace() {
    return this.belongsTo('District', 'kota_lahir');
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
    return await this.where(data).save(newData, { patch: true });
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

  static async getUserProfile(id) {
    const user = await this.where('id_users', id).fetch({ withRelated: ['store', 'birthPlace'], debug: true });
    const store = user.related('store');
    return { user: user.serialize(false, true), store };
  }

  static async getWishlist(id) {
    const user = await this.where('id_users', id).fetch({ withRelated: ['wishlistProducts.store', 'wishlistProducts.images'] });
    const products = user.related('wishlistProducts');
    return products.map((product) => {
      const store = product.related('store');
      const images = product.related('images');
      return { product, store, images };
    });
  }

  /**
   * Get birthplace name by district id
   * @param id {integer} district id
   */
  static async getBirthPlace(id) {
    let name;
    const birthPlace = await new District({ id_kotakab: id }).fetch({ columns: 'nama_kotakab' });
    if (birthPlace) name = toTitleCase(birthPlace.get('nama_kotakab').split(' ')[1]);
    return defaultNull(name);
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
   * Compare plain password with it's hashed password from komuto api
   * @param {string} plain
   * @param {string} hashed
   * @return {bool}
   */
  static async checkPasswordFromApi(plain, hashed) {
    const res = await rp.post({
      url: config.komutoUrl,
      form: {
        page: 'login',
        function: 'validatepassword',
        param: {
          password: plain,
          hash: hashed,
        },
      },
    });
    return JSON.parse(res).data;
  }
}

/**
 * @param pass {bool} true = include password
 * @param birth {bool} true = get name of the district id
 * @param account {bool} true = minimal for account collection
 */
UserModel.prototype.serialize = function (pass = false, birth = false, account = false) {
  const attr = this.attributes;
  if (account) {
    return {
      id: attr.id_users,
      name: attr.namalengkap_users,
      photo: core.imagePath(IMAGE_PATH, attr.pathfoto_users),
      gender: attr.jeniskelamin_users === 'L' ? 'male' : 'female',
      place_of_birth: defaultNull(attr.kota_lahir),
      date_of_birth: defaultNull(attr.tgl_lahir),
    };
  }
  const user = {
    id: attr.id_users,
    marketplace_id: defaultNull(attr.marketplaceuser),
    name: attr.namalengkap_users,
    email: attr.email_users,
    cooperative_member_number: defaultNull(attr.no_anggotakoperasi_users),
    approval_cooperative_status: attr.approval_koperasi_users,
    photo: core.imagePath(IMAGE_PATH, attr.pathfoto_users),
    phone_number: defaultNull(attr.nohp_users),
    gender: attr.jeniskelamin_users === 'L' ? 'male' : 'female',
    status: parseInt(attr.status_users, 10),
    mother_name: defaultNull(attr.ibukandung_users),
    auth_key: defaultNull(attr.auth_key),
    saldo_wallet: checkNull(attr.saldo_wallet, 0),
    place_of_birth: defaultNull(attr.kota_lahir),
    date_of_birth: parseDate(attr.tgl_lahir, null),
    created_at: moment(attr.tgl_create_users).unix(),
    join_at: parseDate(attr.tgl_join_koperasi),
    status_at: moment(attr.tglstatus_users).unix(),
    provider_name: attr.hybridauth_provider_name,
    provider_uid: attr.hybridauth_provider_uid,
  };
  if (pass) {
    user.password = attr.password_users;
    return user;
  }
  if (birth) {
    this.load({ birthPlace: qb => qb.column('nama_kotakab') });
    user.place_of_birth = toTitleCase(this.related('birthPlace').get('nama_kotakab').split(' ')[1]);
  }
  return user;
};


export const User = bookshelf.model('User', UserModel);
export default { User, UserStatus, UserRoles };
