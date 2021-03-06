import core from '../core';

const bookshelf = core.postgres.db;

class PreferenceModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'global_parameters';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_globalparam';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize() {
    return {
      id: this.get('id_globalparam'),
      key: this.get('namavar_globalparam'),
      value: this.get('value1_globalparam'),
      value2: this.get('value2_globalparam'),
      value3: this.get('value3_globalparam'),
      remarks: this.get('remarks_globalparam'),
    };
  }

  /**
   * Get preference value
   */
  static async get(key) {
    const preference = await this.where({ namavar_globalparam: this.matchKey(key) }).fetch();
    if (!preference) return null;
    return preference.serialize();
  }

  /**
   * Matching key
   */
  static matchKey(key) {
    const variable = {
      otp_address: 'masa_aktif_kode_otpaddress',
      otp_hp: 'masa_aktif_kode_otphp',
      payment: 'limit_respon_pembayaran',
      send_product: 'limit_kirimbarang_refund',
      unverified_store: 'masa_aktif_user_unverified',
      order_response: 'limit_respon_sales_order',
    };
    return variable[key];
  }
}

export const Preference = bookshelf.model('Preference', PreferenceModel);
export default { Preference };
