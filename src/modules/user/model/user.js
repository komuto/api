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
   * @param pass {bool} true = include password
   * @param birth {bool} true = get name of the district id
   * @param account {bool} true = minimal for account collection
   */
  serialize(pass = false, birth = false, account = false) {
    if (account) {
      return {
        id: this.get('id_users'),
        name: this.get('namalengkap_users'),
        photo: core.imagePath(IMAGE_PATH, this.get('pathfoto_users')),
        gender: this.get('jeniskelamin_users') === 'L' ? 'male' : 'female',
        place_of_birth: defaultNull(this.get('kota_lahir')),
        date_of_birth: defaultNull(this.get('tgl_lahir')),
      };
    }
    const user = {
      id: this.get('id_users'),
      marketplace_id: defaultNull(this.get('marketplaceuser')),
      name: this.get('namalengkap_users'),
      email: this.get('email_users'),
      cooperative_member_number: defaultNull(this.get('no_anggotakoperasi_users')),
      approval_cooperative_status: this.get('approval_koperasi_users'),
      photo: core.imagePath(IMAGE_PATH, this.get('pathfoto_users')),
      phone_number: defaultNull(this.get('nohp_users')),
      gender: this.get('jeniskelamin_users') === 'L' ? 'male' : 'female',
      status: parseInt(this.get('status_users'), 10),
      mother_name: defaultNull(this.get('ibukandung_users')),
      auth_key: defaultNull(this.get('auth_key')),
      saldo_wallet: checkNull(this.get('saldo_wallet'), 0),
      place_of_birth: defaultNull(this.get('kota_lahir')),
      date_of_birth: parseDate(this.get('tgl_lahir'), null),
      created_at: moment(this.get('tgl_create_users')).unix(),
      join_at: parseDate(this.get('tgl_join_koperasi')),
      status_at: moment(this.get('tglstatus_users')).unix(),
      provider_name: this.get('hybridauth_provider_name'),
      provider_uid: this.get('hybridauth_provider_uid'),
    };
    if (pass) {
      user.password = this.get('password_users');
      return user;
    }
    if (birth) {
      this.load({ birthPlace: qb => qb.column('nama_kotakab') });
      const name = this.related('birthPlace').get('nama_kotakab');
      if (name) user.place_of_birth = toTitleCase(name.split(' ')[1]);
    }
    return user;
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
    const user = await this.where('id_users', id).fetch({ withRelated: ['store', 'birthPlace'] });
    const store = user.related('store');
    return { user: user.serialize(false, true), store };
  }

  static async getWishlist(id) {
    const user = await this.where('id_users', id).fetch({ withRelated: ['wishlistProducts.store', 'wishlistProducts.images', 'wishlistProducts.likes'] });
    const products = user.related('wishlistProducts');
    return products.map((product) => {
      const store = product.related('store');
      const images = product.related('images');
      const countLike = product.related('likes').length;
      product = { ...product.serialize(true, true), count_like: countLike };
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
      if (column[prop] && data[prop] !== undefined) newData[column[prop]] = data[prop];
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

export const User = bookshelf.model('User', UserModel);
export default { User, UserStatus, UserRoles };
