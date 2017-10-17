import bcrypt from 'bcrypt';
import moment from 'moment';
import toTitleCase from 'to-title-case';
import rp from 'request-promise-native';
import _ from 'lodash';
import config from '../../../../config';
import core from '../../core';
import { model as addressModel } from '../../address';
import { OTPHPStatus, OTPAddressStatus } from '../../OTP/model';

const { defaultNull, parseDate, parseNum } = core.utils;
const bookshelf = core.postgres.db;
const { District } = addressModel;

// used by bcrypt to generate new salt
// 8 rounds will produce about 40 hashes per second on a 2GHz core
// see: https://www.npmjs.com/package/bcrypt
const SALT_ROUND = 8;
const IMAGE_PATH = 'user';

export const UserStatus = {
  INACTIVE: 0,
  ACTIVE: 1,
  TEMP_BANNED: 2,
  PERMANENT_BANNED: 3,
};

export const UserCooperativeStatus = {
  NULL: 0,
  PENDING: 1,
  VALID: 2,
  INVALID: 3,
  NOT_MEMBER: 4,
};

export const NotificationType = {
  MESSAGE_FROM_ADMIN: 1,
  NEWSLETTER: 2,
  REVIEW: 3,
  DISCUSSION: 4,
  PRIVATE_MESSAGE: 5,
};

export const getNotification = (notifications, type) => (
  _.find(notifications, o => o.type === type).is_active
);

const notificationDefault = () => [
  { type: NotificationType.MESSAGE_FROM_ADMIN, is_active: true },
  { type: NotificationType.NEWSLETTER, is_active: true },
  { type: NotificationType.REVIEW, is_active: true },
  { type: NotificationType.DISCUSSION, is_active: true },
  { type: NotificationType.PRIVATE_MESSAGE, is_active: true },
];

class UserModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'users';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_users';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  /**
   * @param pass {boolean} true = include password
   * @param birth {boolean} true = get name of the district id
   * @param account {boolean} true = minimal for account collection
   * @param phone {boolean} true = check if the phone is verified
   * @param notification {boolean} true = include notification
   * @param orderDetail {boolean}
   */
  serialize({
              pass = false,
              birth = false,
              account = false,
              phone = false,
              notification = false,
              orderDetail = false,
            } = {}) {
    let user = {
      id: this.get('id_users'),
      name: this.get('namalengkap_users'),
      photo: this.get('pathfoto_users')
        ? core.imagePath(IMAGE_PATH, this.get('pathfoto_users'))
        : config.defaultImage.user,
      phone_number: defaultNull(this.get('nohp_users')),
    };
    if (orderDetail) return user;
    user = {
      ...user,
      gender: this.get('jeniskelamin_users') === 'L' ? 'male' : 'female',
      place_of_birth: defaultNull(this.get('kota_lahir')),
      date_of_birth: parseDate(this.get('tgl_lahir'), null),
    };
    if (account) return user;
    user = {
      ...user,
      marketplace_id: defaultNull(this.get('id_marketplaceuser')),
      email: this.get('email_users'),
      cooperative_member_number: defaultNull(this.get('no_anggotakoperasi_users')),
      approval_cooperative_status: this.get('approval_koperasi_users'),
      phone_number: defaultNull(this.get('nohp_users')),
      status: parseInt(this.get('status_users'), 10),
      mother_name: defaultNull(this.get('ibukandung_users')),
      auth_key: defaultNull(this.get('auth_key')),
      saldo_wallet: parseNum(this.get('saldo_wallet')),
      created_at: moment(this.get('tgl_create_users')).unix(),
      join_at: parseDate(this.get('tgl_join_koperasi')),
      status_at: moment(this.get('tglstatus_users')).unix(),
      provider_name: this.get('hybridauth_provider_name'),
      provider_uid: this.get('hybridauth_provider_uid'),
      reg_token: this.get('reg_token'),
    };
    if (pass) user.password = this.get('password_users');
    if (birth) {
      this.load({ birthPlace: qb => qb.column('nama_kotakab') });
      const name = this.related('birthPlace').get('nama_kotakab');
      user.place_of_birth_id = user.place_of_birth;
      if (name) user.place_of_birth = toTitleCase(name.split(' ')[1]);
    }
    if (phone) {
      user.is_phone_verified = this.related('verifyPhone').length !== 0;
    }
    if (notification) user.notifications = this.get('notifications') || notificationDefault();
    return user;
  }

  /**
   * Add relation to Store
   */
  store() {
    return this.hasOne('Store', 'id_users');
  }

  /**
   * Add relation to Address
   */
  addresses() {
    return this.hasMany('Address', 'id_users');
  }

  address() {
    return this.hasOne('Address', 'id_users');
  }

  birthPlace() {
    return this.belongsTo('District', 'kota_lahir');
  }

  /**
   * Add relation BankAccount
   */
  bankAccounts() {
    return this.hasMany('BankAccount', 'id_users');
  }

  /**
   * Add relation to OTPHP
   */
  verifyPhone() {
    return this.hasMany('OTPHP', 'id_users');
  }

  /**
   * Add relation to ResolutionCenter
   */
  resolutionCenter() {
    return this.hasMany('ResolutionCenter', 'id_users');
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
    data.approval_koperasi_users = UserCooperativeStatus.NULL;
    data.tgl_create_users = moment();
    data.status_users = UserStatus.INACTIVE;
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
    await this.where({ id_users: id }).save({ status_users: UserStatus.ACTIVE }, { patch: true });
  }

  static async getById(id) {
    return await new this({ id_users: id }).fetch();
  }

  static async getByEmail(email) {
    return await new this({ email_users: email }).fetch();
  }

  static async getWithPhone(data) {
    return await new this(data).fetch({
      withRelated: [{
        verifyPhone: qb => qb.where('status_otphp', OTPHPStatus.VERIFIED),
      }],
    });
  }

  static async getBySocial(name, uid) {
    const user = await new this({
      hybridauth_provider_name: name,
      hybridauth_provider_uid: uid,
    }).fetch();
    return user ? user.serialize() : user;
  }

  static async getUserProfile(id) {
    let user = await this.where('id_users', id).fetch({
      withRelated: [
        'birthPlace',
        { 'store.verifyAddress': qb => qb.where('status_otpaddress', OTPAddressStatus.VERIFIED) },
        { verifyPhone: qb => qb.where('status_otphp', OTPHPStatus.VERIFIED) },
      ],
    });
    const store = user.related('store').serialize({ verified: true });
    user = user.serialize({ birth: true, phone: true });
    return { user, store };
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
   * Update FCM registration token
   */
  static async updateRegToken(id, token) {
    const user = await this.where({ id_users: id }).save({ reg_token: token }, { patch: true });
    return await user.refresh();
  }

  static getNotificationContent(type, name) {
    let content = '';
    switch (type) {
      case NotificationType.MESSAGE_FROM_ADMIN:
        content = 'Setiap pesan pribadi dari admin saya terima.';
        break;
      case NotificationType.NEWSLETTER:
        content = `Setiap Pesan Berita dari ${name}.`;
        break;
      case NotificationType.REVIEW:
        content = 'Setiap Review dan komentar saya terima.';
        break;
      case NotificationType.DISCUSSION:
        content = 'Setiap Diskusi produk dan komentar saya terima.';
        break;
      case NotificationType.PRIVATE_MESSAGE:
        content = 'Setiap Pesan Pribadi saya terima';
        break;
      default:
        break;
    }
    return content;
  }

  static getNotifications(notifications, marketplaceName) {
    if (!notifications) notifications = notificationDefault();
    return notifications.map(val => ({
      ...val,
      content: this.getNotificationContent(val.type, marketplaceName),
    }));
  }

  static async updateWallet(id, wallet) {
    return await this.where({ id_users: id }).save({ saldo_wallet: wallet }, { patch: true });
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
      marketplace_id: 'id_marketplaceuser',
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
      reg_token: 'reg_token',
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
export default { User, UserStatus };
