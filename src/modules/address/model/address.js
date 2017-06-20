import core from '../../core';
import { BadRequestError } from '../../../../common/errors';
import './province';
import './district';
import './sub_district';
import './village';

const bookshelf = core.postgres.db;

class AddressModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'alamat_users';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_alamatuser';
  }

  province() {
    return this.belongsTo('Province', 'id_provinsi', 'id_provinsi');
  }

  district() {
    return this.belongsTo('District', 'id_kotakab', 'id_kotakab');
  }

  subdistrict() {
    return this.belongsTo('Subdistrict', 'id_kecamatan', 'id_kecamatan');
  }

  village() {
    return this.belongsTo('Village', 'id_kelurahan', 'id_kelurahan');
  }

  static async getFullAddress(id) {
    const address = await this.where({ id_users: id, alamat_primary: '1' }).fetch({
      withRelated: ['province', 'district', 'subdistrict', 'village'],
    });
    if (!address) {
      throw new BadRequestError('No address found');
    }
    const province = address.related('province');
    const district = address.related('district');
    const subdistrict = address.related('subdistrict');
    const village = address.related('village');
    return {
      ...address.serialize(),
      province,
      district,
      subdistrict,
      village };
  }

  /**
   * Create address
   * @param {Object} data
   */
  static async create(data) {
    await new this(data).save();
  }

  /**
   * Update address
   * @param {Object} data
   * @param {Object} newData
   */
  static async update(data, newData) {
    await this.where(data).save(newData, { patch: true });
  }

  /**
   * Get a line item by id
   * @param {Integer} id
   */
  static async getById(id) {
    return await this.where({ address_id: id }).fetch();
  }

  /**
   * Get a line item by condition
   * @param {Object} condition
   */
  static async get(condition = null) {
    return await this.where(condition).fetchAll();
  }

  /**
   * Check if primary address already in db
   * @param {number} id
   */
  static async checkPrimary(idUsers, idAddress) {
    const query = { id_users: idUsers, alamat_primary: '1' };
    if (idAddress) {
      query.id_alamatuser = idAddress;
    }
    const address = await this.where(query).fetch();
    return address;
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      user_id: 'id_users',
      province_id: 'id_provinsi',
      district_id: 'id_kotakab',
      sub_district_id: 'id_kecamatan',
      village_id: 'id_kelurahan',
      name: 'nama_penerima',
      email: 'email_penerima',
      phone_number: 'tlp_penerima',
      postal_code: 'kodepos_user',
      address: 'alamat_user',
      alias_address: 'alamat_alias',
      is_primary: 'alamat_primary',
      is_sale_address: 'alamat_originjual',
      is_tender_address: 'alamat_originlelang',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop]) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

AddressModel.prototype.serialize = function () {
  return {
    id: this.attributes.id_alamatuser,
    name: this.attributes.nama_penerima,
    email: this.attributes.email_penerima,
    phone_number: this.attributes.tlp_penerima,
    postal_code: this.attributes.kodepos_user,
    address: this.attributes.alamat_user,
    alias_address: this.attributes.alamat_alias,
    is_primary_address: this.attributes.alamat_primary === '1',
    is_sale_address: this.attributes.alamat_originjual === '1',
    is_tender_address: this.attributes.alamat_originlelang === '1',
  };
};

// eslint-disable-next-line import/prefer-default-export
export const Address = bookshelf.model('Address', AddressModel);
export default { Address };
