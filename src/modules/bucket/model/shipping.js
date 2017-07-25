import core from '../../core';
import { createShippingError } from './../messages';

const { parseNum } = core.utils;
const bookshelf = core.postgres.db;

class ShippingModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'pengiriman_produk';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_pengiriman_produk';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize() {
    const shipping = {
      id: parseNum(this.get('id_pengiriman_produk')),
      expedition_service_id: this.get('id_ekspedisiservice'),
      address_id: this.get('id_alamatuser'),
      delivery_cost: parseNum(this.get('harga_ongkir')),
      insurance_fee: parseNum(this.get('nilai_asuransi')),
      note: this.get('keterangan'),
      is_insurance: !!parseNum(this.get('nilai_asuransi')),
      address: this.relations.address ? this.related('address') : undefined,
      expedition_service: this.relations.expeditionService ? this.related('expeditionService') : undefined,
    };
    if (this.relations.address) delete shipping.address_id;
    if (this.relations.expeditionService) delete shipping.expedition_service_id;
    return shipping;
  }

  /**
   * Add relation to product
   */
  expeditionService() {
    return this.belongsTo('ExpeditionService', 'id_ekspedisiservice');
  }

  /**
   * Add relation to address
   */
  address() {
    return this.belongsTo('Address', 'id_alamatuser');
  }

  /**
   * Create shipping
   */
  static async create(data) {
    return await new this(data).save().catch((e) => {
      console.log(e);
      throw createShippingError('shipping', 'error');
    });
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      expedition_service_id: 'id_ekspedisiservice',
      address_id: 'id_alamatuser',
      delivery_cost: 'harga_ongkir',
      insurance_fee: 'nilai_asuransi',
      note: 'keterangan',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop]) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const Shipping = bookshelf.model('Shipping', ShippingModel);
export default { Shipping };
