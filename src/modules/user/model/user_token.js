import moment from 'moment';
import core from '../../core';

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
    token = 's24ffdsf7fs3829gdadfs489253hj'; //jwt.sign({ id_users: id }, config.jwt.secretOrKey).slice(0, 49);
    await new this({
      id_users: id,
      type_tokenuser: type,
      value_tokenuser: token,
      status_tokenuser: TokenStatus.ACTIVE,
      tglstatus_tokenuser: moment(),
    }).save();
    return token;
  }
}

export const UserToken = bookshelf.model('UserToken', UserTokenModel);
export default { UserToken, TokenType, TokenStatus };

