import moment from 'moment';
import randomString from 'randomstring';
import core from '../../core';

const bookshelf = core.postgres.db;

export const OTPAddressStatus = {
  CREATED: 0,
  VERIFIED: 1,
  DESTROY: 2,
};

class OTPAddressModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'otp_address';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_otpaddress';
  }

  /**
   * Create OTP address
   */
  static async create(userId) {
    const data = this.matchDBColumn({
      user_id: userId,
      code: randomString.generate(10),
      status: OTPAddressStatus.CREATED,
      created_at: moment(),
      expired_at: moment().add(7, 'd'),
    });
    return await new this(data).save();
  }

  /**
   * Verify store
   */
  static async verify(userId, storeId, code) {

    return true;
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      user_id: 'id_users',
      code: 'kode_otpaddress',
      status: 'status_otpaddress',
      created_at: 'datecreated_otpaddress',
      expired_at: 'expdate_otpaddress',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop] && data[prop] !== undefined) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const OTPAddress = bookshelf.model('OTPAddress', OTPAddressModel);
export default { OTPAddress, OTPAddressStatus };
