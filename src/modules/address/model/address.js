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
   * Create a new line item
   * @param {Object} data
   */
  static async create(data) {
    const address = new this(data);
    return await address.save();
  }

  /**
   * Update line item
   * @param {Integer} id
   * @param {Object} data
   */
  static async update(id, data) {
    const address = new this({ address_id: id });
    return await address.save(data);
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
export const Address = AddressModel;
export default bookshelf.model('Address', AddressModel);
