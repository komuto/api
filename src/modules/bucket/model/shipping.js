import core from '../../core';
import { createShippingError, updateShippingError } from './../messages';

const { parseNum, parseDate } = core.utils;
const bookshelf = core.postgres.db;

export const ShippingSenderStatus = {
  DEFAULT: 1,
  ACCEPT: 2,
  DECLINE: 3,
  SENT: 4,
};

export const ShippingReceiverStatus = {
  DEFAULT: 1,
  ACCEPT: 2,
  DECLINE: 3,
};

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

  serialize({ minimal = false } = {}) {
    const shipping = {
      id: parseNum(this.get('id_pengiriman_produk')),
      delivery_cost: parseNum(this.get('harga_ongkir')),
      insurance_fee: parseNum(this.get('nilai_asuransi')),
      is_insurance: this.get('is_asuransi'),
      address: this.relations.address ? this.related('address').serialize({ full: minimal }) : undefined,
      expedition_service: this.relations.expeditionService ? this.related('expeditionService') : undefined,
    };
    if (minimal) return shipping;
    return {
      ...shipping,
      expedition_service_id: this.relations.expeditionService ? undefined : this.get('id_ekspedisiservice'),
      address_id: this.relations.address ? undefined : this.get('id_alamatuser'),
      note: this.get('keterangan'),
      seller_note: this.get('keterangan_seller'),
      airway_bill: this.get('resiresponkirim'),
      sender_status: parseNum(this.get('statusresponkirim')),
      sender_status_at: parseDate(this.get('tglstatusresponkirim'), null),
      sender_status_expired_at: parseDate(this.get('expdateresponkirim'), null),
      receiver_status: parseNum(this.get('statusresponterima')),
      receiver_status_at: parseDate(this.get('tglstatusresponterima'), null),
      receiver_status_expired_at: parseDate(this.get('expdateresponterimabarang'), null),
    };
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
    return await new this(data).save().catch(() => {
      throw createShippingError('shipping', 'error');
    });
  }

  /**
   * Update shipping
   */
  static async update(id, data) {
    return await this.where({ id_pengiriman_produk: id }).save(data, { patch: true })
      .catch(() => {
        throw updateShippingError('shipping', 'error');
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
      airway_bill: 'resiresponkirim',
      is_insurance: 'is_asuransi',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop]) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const Shipping = bookshelf.model('Shipping', ShippingModel);
export default { Shipping, ShippingSenderStatus, ShippingReceiverStatus };
