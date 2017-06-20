import moment from 'moment';
import md5 from 'md5';
import core from '../../core';
import { BadRequestError } from '../../../../common/errors';

const bookshelf = core.postgres.db;

export const TokenStatus = {
  INACTIVE: '0',
  ACTIVE: '1',
};

export const TokenType = {
  FORGOT_PASSWORD: '2',
  EMAIL_ACTIVATION: '1',
};

class UserTokenModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'token_user';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_tokenuser';
  }

  /**
   * Generate token if not found in db
   * @param {integer} id
   * @param {string} token type
   * @return {string} token
   */
  static async generateToken(id, type) {
    let token = await this.where({
      id_users: id,
      type_tokenuser: type,
      status_tokenuser: TokenStatus.ACTIVE,
    }).fetch();
    if (token) {
      return token.get('value_tokenuser');
    }
    token = md5(id);
    await new this({
      id_users: id,
      type_tokenuser: type,
      value_tokenuser: token,
      status_tokenuser: TokenStatus.ACTIVE,
      tglstatus_tokenuser: moment(),
    }).save();
    return token;
  }

  /**
   * @param {string} token
   */
  static async getId(tokenValue) {
    const token = await this.where({ value_tokenuser: tokenValue }).fetch();
    if (!token) {
      throw new BadRequestError('Token not found');
    }
    return token.get('id_users');
  }

  /**
   * Expire the token by changing its status
   * @param {string }token
   */
  static async expire(token) {
    await this.where({ value_tokenuser: token })
      .save({ status_tokenuser: TokenStatus.INACTIVE }, { patch: true });
  }
}

export const UserToken = bookshelf.model('UserToken', UserTokenModel);
export default { UserToken, TokenType, TokenStatus };

