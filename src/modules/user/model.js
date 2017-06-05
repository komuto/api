import bcrypt from 'bcrypt';
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
  INACTIVE: 'inactive',
  ACTIVE: 'active',
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
    return bcrypt.hashSync(str, null);
  }

  /**
   * Create a new user with callback
   * @param {Object} data
   */
  static async create(data) {
    const user = new this(data);
    return await user.save();
  }

  static async getById(id) {
    return await this.where({ id_users: id }).fetch();
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
      url: 'http://api.komuto.dev',
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

export const User = UserModel;
