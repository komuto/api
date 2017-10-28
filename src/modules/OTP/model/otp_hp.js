import moment from 'moment';
import rp from 'request-promise-native';
import sha1 from 'sha1';
import md5 from 'md5';
import randomInt from 'random-int';
import core from '../../core';
import { otp } from '../../../../config';
import { Preference } from './../../preference/model';

const bookshelf = core.postgres.db;

export const OTPHPStatus = {
  CREATED: 0,
  VERIFIED: 1,
  DESTROY: 2,
};

class OTPHPModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'otp_hp';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_otphp';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  /**
   * Check if otp is already created
   */
  static async checkOTP(data) {
    return await this.query(qb => qb.where(data).andWhere('expdate_otphp', '>', moment())).fetch();
  }

  async create(data) {
    const limit = await Preference.get('otp_hp');
    const created = moment();
    data = {
      ...data,
      kode_otphp: randomInt(10000, 99999),
      datecreated_otphp: created.toDate(),
      expdate_otphp: created.clone().add(limit.value, 'd').toDate(),
    };
    return await this.save(data, { method: 'insert' });
  }

  /**
   * Send otp code through sms
   */
  async sendSms(phone) {
    const { datecreated_otphp: created,
            expdate_otphp: expired,
            kode_otphp: kode } = this.attributes;
    const createdSend = moment(created).format('YYYY-MM-DD HH:mm:ss');
    const expiredSend = moment(expired).format('HH:mm');
    const body = {
      jenis: 'kirimsms',
      tujuan: phone,
      isi: `Berikut adalah kode OTP anda : ${kode} . Jangan membagikannya karena kode ini\
      bersifat rahasia. Berlaku sampai jam ${expiredSend} WIB`,
      tanggal: createdSend,
      sign: sha1(`kirimsms${md5(`${otp.apiKey}${createdSend}`)}`),
    };

    await rp.post({
      url: otp.apiUrl,
      body,
      json: true,
    });
  }
}

export const OTPHP = bookshelf.model('OTPHP', OTPHPModel);
export default { OTPHP, OTPHPStatus };

