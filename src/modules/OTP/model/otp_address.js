import moment from 'moment';
import randomInt from 'random-int';
import core from '../../core';
import { verifyOTPAddressError } from './../messages';
import { Preference } from './../../preference/model';

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

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize() {
    return {
      id: this.get('id_otpaddress'),
      user_id: this.get('id_users'),
      code: this.get('kode_otpaddress'),
      status: this.get('status_otpaddress'),
      created_at: this.get('datecreated_otpaddress'),
      expired_at: this.get('expdate_otpaddress'),
    };
  }

  /**
   * Create OTP address
   */
  static async create(userId) {
    const limit = await Preference.get('otp_address');
    const data = this.matchDBColumn({
      user_id: userId,
      code: randomInt(100000, 999999),
      status: OTPAddressStatus.CREATED,
      created_at: moment().toDate(),
      expired_at: moment().add(limit.value, 'd').toDate(),
    });
    return await new this(data).save();
  }

  /**
   * Verify store
   */
  static async verify(userId, code) {
    const otp = await this.where({
      id_users: userId,
      kode_otpaddress: code,
      status_otpaddress: OTPAddressStatus.CREATED,
    }).query((qb) => {
      qb.where('expdate_otpaddress', '>', moment());
    }).fetch();
    if (!otp) throw verifyOTPAddressError('OTPAddress', 'not_found');
    return await otp.save({ status_otpaddress: OTPAddressStatus.VERIFIED }, { patch: true });
  }

  /**
   * Update status OTP Address
   */
  static async updateStatus(userId) {
    return await this.where({ id_users: userId })
      .save({ status_otpaddress: OTPAddressStatus.DESTROY }, { patch: true }).catch(() => {});
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
