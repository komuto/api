import Promise from 'bluebird';
import _ from 'lodash';
import core from '../core';
import productModule from '../product';
import lineItemModule from '../line_item';
import couponModule from '../coupon';

const { Product } = productModule.model;
const { LineItem, LineItemType } = lineItemModule.model;
const { Coupon } = couponModule.model;
const bookshelf = core.mysql.db;

export const OrderStatus = {
  CART: 'cart',
  CANCELED: 'canceled',
  CHECKOUT_COMPLETE: 'checkout-complete',
  PENDING_SHIPMENT: 'pending-shipment',
  SHIPPED: 'shipped',
  COMPLETE: 'complete',
};

class OrderLogModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'order_log';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'order_log_id';
  }
  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return true;
  }

  /**
   * Create a new order log
   * @param {Object} data
   */
  static async create(data) {
    const orderLog = new this(data);
    return await orderLog.save();
  }

  /**
   * Get a order log by id
   * @param {Integer} id
   */
  static async getById(id) {
    return await this.where({ line_item_id: id }).fetch();
  }

  /**
   * Get a order log by condition
   * @param {Object} condition
   */
  static async get(condition = null) {
    return await this.where(condition).fetchAll();
  }
}

export const OrderLog = OrderLogModel;

class OrderModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'order';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'order_id';
  }
  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return true;
  }

  async saveOrderLog() {
    await OrderLog.create({
      log: this.get('status'),
      order_id: this.get('order_id'),
    });
  }

  async decreaseProductQuantity() {
    if (this.get('status') === OrderStatus.CHECKOUT_COMPLETE) {
      const lineItems = await LineItem.get({ order_id: this.get('order_id') });
      const productUpdate = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const lineItemData of lineItems.models) {
        if (lineItemData.get('entity_type') === LineItemType.PRODUCT) {
          const productId = lineItemData.get('entity_id');
          const product = await Product.getById(productId);
          const newQuantity = product.get('quantity') - lineItemData.get('quantity');
          productUpdate.push(Product.update(productId, { quantity: newQuantity }));
        }
      }
      await Promise.all(productUpdate);
    }
  }

  async decreaseCouponQuantity() {
    if (this.get('status') === OrderStatus.CHECKOUT_COMPLETE) {
      const lineItems = await LineItem.get({ order_id: this.get('order_id') });
      const couponUpdate = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const lineItemData of lineItems.models) {
        if (lineItemData.get('entity_type') === LineItemType.COUPON) {
          const couponId = lineItemData.get('entity_id');
          const coupon = await Coupon.getById(couponId);
          const newQuantity = coupon.get('quantity') - lineItemData.get('quantity');
          couponUpdate.push(Coupon.update(couponId, { quantity: newQuantity }));
        }
      }
      await Promise.all(couponUpdate);
    }
  }

  async increaseProductQuantity() {
    if (this.get('status') === OrderStatus.CANCELED) {
      const lineItems = await LineItem.get({ order_id: this.get('order_id') });
      const productUpdate = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const lineItemData of lineItems.models) {
        if (lineItemData.get('entity_type') === LineItemType.PRODUCT) {
          const productId = lineItemData.get('entity_id');
          const product = await Product.getById(productId);
          const newQuantity = product.get('quantity') + lineItemData.get('quantity');
          productUpdate.push(Product.update(productId, { quantity: newQuantity }));
        }
      }
      await Promise.all(productUpdate);
    }
  }

  async increaseCouponQuantity() {
    if (this.get('status') === OrderStatus.CANCELED) {
      const lineItems = await LineItem.get({ order_id: this.get('order_id') });
      const couponUpdate = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const lineItemData of lineItems.models) {
        if (lineItemData.get('entity_type') === LineItemType.COUPON) {
          const couponId = lineItemData.get('entity_id');
          const coupon = await Coupon.getById(couponId);
          const newQuantity = coupon.get('quantity') + lineItemData.get('quantity');
          couponUpdate.push(Coupon.update(couponId, { quantity: newQuantity }));
        }
      }
      await Promise.all(couponUpdate);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async calculateTotalAmount(model, response, options) {
    if (model) {
      const lineItems = await LineItem.get({ order_id: model.get('order_id') });
      let totalAmount = 0;
      lineItems.each((lineItem) => {
        totalAmount += lineItem.get('total_amount');
      });
      model.set('total_amount', totalAmount);
    }
  }

  initialize() {
    this.on('saved', this.saveOrderLog);
    this.on('saved', this.decreaseProductQuantity);
    this.on('saved', this.decreaseCouponQuantity);
    this.on('saved', this.increaseProductQuantity);
    this.on('saved', this.increaseCouponQuantity);
    this.on('fetched', this.calculateTotalAmount);
  }

  /**
   * Add relation to line item
   */
  lineItems() {
    return this.hasMany(LineItem, 'order_id');
  }

  /**
   * Add relation to order log
   */
  orderLogs() {
    return this.hasMany(OrderLog, 'order_id');
  }

  /**
   * Create a new order
   * @param {Object} data
   */
  static async create(data) {
    const order = new this(data);
    return await order.save();
  }

  /**
   * Update order
   * @param {Integer} id
   * @param {Object} data
   */
  static async update(id, data) {
    data = _.omitBy(data, _.isNil);
    const order = new this({ order_id: id });
    return await order.save(data);
  }

  /**
   * Get a order by id
   * @param {Integer} id
   */
  static async getById(id) {
    return await this.where({ order_id: id }).fetch();
  }

  /**
   * Get a order by condition
   * @param {Object} condition
   */
  static async get(condition = null) {
    condition = _.omitBy(condition, _.isNil);
    return await this.where(condition).fetchAll();
  }
}

export const Order = OrderModel;
