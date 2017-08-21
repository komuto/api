import core from '../../core';
import { getAddressError } from './../messages';

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

  serialize() {
    return {
      id: this.get('id_alamatuser'),
      name: this.get('nama_penerima'),
      email: this.get('email_penerima'),
      phone_number: this.get('tlp_penerima'),
      postal_code: this.get('kodepos_user'),
      address: this.get('alamat_user'),
      alias_address: this.get('alamat_alias'),
      is_primary_address: this.get('alamat_primary') === '1',
      is_sale_address: this.get('alamat_originjual') === '1',
      is_tender_address: this.get('alamat_originlelang') === '1',
      is_checked: false,
    };
  }

  /**
   * Add relation to User
   */
  user() {
    return this.belongsTo('User', 'id_users', 'id_users');
  }

  province() {
    return this.belongsTo('Province', 'id_provinsi', 'id_provinsi');
  }

  district() {
    return this.belongsTo('District', 'id_kotakab', 'id_kotakab');
  }

  subDistrict() {
    return this.belongsTo('SubDistrict', 'id_kecamatan', 'id_kecamatan');
  }

  village() {
    return this.belongsTo('Village', 'id_kelurahan', 'id_kelurahan');
  }

  /**
   * Get Full Address
   * @param idUser {integer} user id
   * @param isPrimary {boolean} fetch only primary address
   * @param idAddress {integer} address id
   * @param isSale {boolean} sale address
   */
  static async getFullAddress(idUser, isPrimary = false, idAddress, isSale = false) {
    const query = { id_users: idUser };
    if (isPrimary === true) query.alamat_primary = 1;
    if (isSale === true) query.alamat_originjual = 1;
    if (idAddress) query.id_alamatuser = idAddress;
    const address = await this.where(query).fetch({
      withRelated: ['province', 'district', 'subDistrict', 'village'],
    });
    if (!address) {
      return false;
    }
    const province = address.related('province');
    const district = address.related('district');
    const subDistrict = address.related('subDistrict');
    const village = address.related('village');
    return {
      ...address.serialize(),
      province,
      district,
      subDistrict,
      village };
  }

  /**
   * Get store address model
   * @param userId {integer} user id
   */
  static async getStoreAddressModel(userId) {
    return await this.where({ id_users: userId, alamat_originjual: 1 }).fetch();
  }

  /**
   * Get All Address
   * @param idUser {integer} user id
   */
  static async getFullAddressAll(idUser) {
    const addresses = await this.where({ id_users: idUser, alamat_originjual: 0 }).fetchAll({
      withRelated: ['province', 'district', 'subDistrict', 'village'],
    });
    if (!addresses) {
      return false;
    }
    return addresses.map((address) => {
      const province = address.related('province');
      const district = address.related('district');
      const subDistrict = address.related('subDistrict');
      const village = address.related('village');
      return {
        ...address.serialize(),
        province,
        district,
        subDistrict,
        village };
    });
  }

  /**
   * Create address
   * @param {Object} data
   */
  static async create(data) {
    const address = await new this(data).save();
    await address.load(['province', 'district', 'subDistrict', 'village']);
    const province = address.related('province');
    const district = address.related('district');
    const subDistrict = address.related('subDistrict');
    const village = address.related('village');
    return {
      ...address.serialize(),
      province,
      district,
      subDistrict,
      village };
  }

  /**
   * Update address
   * @param {Object} data
   * @param {Object} newData
   */
  static async update(data, newData) {
    const address = await this.where(data).save(newData, { method: 'update', require: false })
      .catch(() => { throw getAddressError('address', 'not_found'); });
    await address.refresh({ withRelated: ['province', 'district', 'subDistrict', 'village'] });

    const province = address.related('province');
    const district = address.related('district');
    const subDistrict = address.related('subDistrict');
    const village = address.related('village');
    return {
      ...address.serialize(),
      province,
      district,
      subDistrict,
      village,
    };
  }

  /**
   * Get a line item by id
   * @param {integer} id
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
   * @param idUser {integer} user id
   * @param idAddress {integer} OPTIONAL address id
   */
  static async checkPrimary(idUser, idAddress) {
    const query = { id_users: idUser, alamat_primary: '1' };
    if (idAddress) {
      query.id_alamatuser = idAddress;
    }
    return await this.where(query).fetch();
  }

  /**
   * Check if there are other primary address beside the supplied idAddress
   * @param idUser {integer} user id
   * @param idAddress {integer} OPTIONAL address id
   */
  static async checkOtherPrimary(idUser, idAddress) {
    const address = await this.query({
      whereNot: { id_alamatuser: idAddress },
      andWhere: { id_users: idUser, alamat_primary: '1' },
    }).fetch();
    return address ? address.serialize() : address;
  }

  /**
   * Get store address
   * @param {integer} userId
   * @param {integer} districtId
   */
  static async getStoreAddress(userId, districtId) {
    const param = {
      id_users: userId,
      alamat_originjual: 1,
    };
    if (districtId) param.id_kotakab = districtId;
    return await this.where(param).fetch({ withRelated: ['province', 'district'] });
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

export const Address = bookshelf.model('Address', AddressModel);
export default { Address };
