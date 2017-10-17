import moment from 'moment';
import rp from 'request-promise-native';
import sha1 from 'sha1';
import md5 from 'md5';
import randomInt from 'random-int';
import core from '../../core';
import { otp } from '../../../../config';
import { Preference } from './../../preference/model';

const bookshelf = core.postgres.db;

export const OTPStatus = {
  DRAFT: 0,
  SENT: 1,
  USED: 2,
};

class OTPModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'otp';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  static async checkOTP(data) {
    return await this.query(qb => qb.where(data).andWhere('date_expired', '>', moment())).fetch();
  }

  async create(data) {
    const limit = await Preference.get('otp_hp');
    const created = moment();
    data = {
      ...data,
      kode: randomInt(10000, 99999),
      date_created: created,
      date_expired: created.clone().add(limit.value, 'd'),
    };
    return await this.save(data, { method: 'insert' });
  }

  /**
   * Send otp code through sms
   */
  async sendSms() {
    const { no_hp: phone, date_created: created, date_expired: expired, kode } = this.attributes;
    const createdSend = moment(created).format('YYYY-MM-DD HH:mm:ss');
    const dateExpiredSend = moment(expired).format('DD-MM-YYYY');
    const timeExpiredSend = moment(expired).format('HH:mm');
    const body = {
      jenis: 'kirimsms',
      tujuan: phone,
      isi: `Berikut adalah kode OTP anda : ${kode} . Jangan membagikannya karena kode ini\
      bersifat rahasia. Berlaku sampai ${dateExpiredSend} jam ${timeExpiredSend} WIB`,
      tanggal: createdSend,
      sign: sha1(`kirimsms${md5(`${otp.apiKey}${createdSend}`)}`),
    };

    await rp.post({
      url: otp.apiUrl,
      body,
      json: true,
    });
    // Update status to sent
    await this.save({ status: OTPStatus.SENT }, { patch: true });
  }
}

export const OTP = bookshelf.model('OTP', OTPModel);
export default { OTP, OTPStatus };

