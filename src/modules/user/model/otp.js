import moment from 'moment';
import rp from 'request-promise-native';
import sha1 from 'sha1';
import md5 from 'md5';
import core from '../../core';
import { otp } from '../../../../config';

const bookshelf = core.postgres.db;

export const OTPStatus = {
  DRAFT: '0',
  SENT: '1',
  USED: '2',
};

class OTPModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'otp';
  }

  static async create(data) {
    const created = moment();
    data = {
      ...data,
      status: OTPStatus.DRAFT,
      kode: Math.floor((Math.random() * (99999 - 10000)) + 10000),
      date_created: created,
      date_expired: created.clone().add(1, 'hour'),
    };
    return await this.forge().save(data, { method: 'insert' });
  }

  /**
   * Send otp code through sms
   */
  async sendSms() {
    const { no_hp: phone, date_created: created, date_expired: expired, kode } = this.attributes;
    const createdSend = created.format('YYYY-MM-DD HH:mm:ss');
    const expiredSend = expired.format('HH:mm');
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

export const OTP = bookshelf.model('OTP', OTPModel);
export default { OTP, OTPStatus };

