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
    };
    return variable[key];
  }
}

export const Preference = bookshelf.model('Preference', PreferenceModel);
export default { Preference };
