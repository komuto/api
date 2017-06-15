import bcrypt from 'bcrypt';
import moment from 'moment';
import rp from 'request-promise';
import config from '../../../config';
import core from '../../modules/core';

const bookshelf = core.mysql.connect(config.knex);

bookshelf.plugin('pagination');

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

export const Status = UserStatus;

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
    return true;
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
    const user = this.forge(data);
    return await user.save();
  }

  static async getById(id) {
    const user = await this.forge({ id_users: id }).fetch();
    return user.serialize();
  }

  static async getBySocial(name, uid) {
    const user = await this.forge({
      hybridauth_provider_name: name,
      hybridauth_provider_uid: uid,
    }).fetch();
    return user.serialize();
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
      url: 'http://api.komutodev.aptmi.com/komuto-api/',
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
    marketplace_id: this.attributes.marketplaceuser,
    name: this.attributes.namalengkap_users,
    email: this.attributes.email_users,
    cooperative_member_number: this.attributes.no_anggotakoperasi_users,
    approval_cooperative_status: this.attributes.approval_koperasi_users,
    photo: this.attributes.pathfoto_users,
    phone_number: this.attributes.nohp_users,
    gender: this.attributes.jeniskelamin_users === 'L' ? 'male' : 'female',
    status: this.attributes.status_users,
    mother_name: this.attributes.ibukandung_users,
    auth_key: this.attributes.auth_key,
    saldo_wallet: this.attributes.saldo_wallet,
    place_of_birth: this.attributes.kota_lahir,
    date_of_birth: this.attributes.tgl_lahir,
    created_at: moment(this.attributes.tgl_create_users).unix(),
    join_at: this.attributes.tgl_join_koperasi,
    status_at: moment(this.attributes.tglstatus_users).unix(),
    provider_name: this.attributes.hybridauth_provider_name,
    provider_uid: this.attributes.hybridauth_provider_uid,
  };
};

export const User = UserModel;
