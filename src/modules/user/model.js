import bcrypt from 'bcrypt';
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
}

export const User = UserModel;

class AddressModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'address';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'address_id';
  }
  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return true;
  }

  /**
   * Create a address
   * @param {Object} data
   */
  static async create(data) {
    const lineItem = new this(data);
    return await lineItem.save();
  }

  /**
   * Get a address by id
   * @param {Integer} id
   */
  static async getById(id) {
    return await this.where({ address_id: id }).fetch();
  }

  /**
   * Get a address by condition
   * @param {Object} condition
   */
  static async get(condition = null) {
    return await this.where(condition).fetchAll();
  }
}

export const Address = AddressModel;
