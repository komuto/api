import _ from 'lodash';
import { Bucket, Promo, Item, Shipping, BucketStatus, PromoType } from './model';
import { Product, Dropship } from '../product/model';
import { Expedition } from '../expedition/model';
import { Invoice, InvoiceStatus } from '../payment/model';
import { getBucketError, getItemError } from './messages';
import { BadRequestError } from '../../../common/errors';
import { getProductAndStore } from '../core/utils';
import { getProductError } from '../product/messages';
import { User } from '../user/model';
import { TransSummary, SummTransType, TransType } from '../saldo/model';

export const BucketController = {};
export default { BucketController };

BucketController.getCount = async (req, res, next) => {
  const count = await Bucket.getCount(req.user.id);
  req.resData = {
    message: 'Count Bucket',
    data: { count },
  };
  return next();
};

BucketController.getPromo = async (req, res, next) => {
  const bucket = await Bucket.get(req.user.id);
  const promo = await Promo.get(req.query.code);
  await Bucket.addPromo(bucket.serialize().id, promo.serialize().id);
  req.resData = {
    message: 'Promo Data',
    data: promo,
  };
  return next();
};

BucketController.cancelPromo = async (req, res, next) => {
  const bucket = await Bucket.get(req.user.id);
  await Bucket.cancelPromo(bucket.serialize().id);
  return next();
};

BucketController.getBucket = async (req, res, next) => {
  const bucket = await Bucket.getDetail(req.user.id);
  req.resData = {
    message: 'Bucket Data',
    data: bucket,
  };
  return next();
};

BucketController.getCost = async (body, product) => {
  const {
    expedition,
    services,
  } = await Expedition.getServiceByServiceName(body.expedition_id, body.service);
  const query = {
    origin_ro_id: body.origin_ro_id,
    destination_ro_id: body.destination_ro_id,
    weight: product.weight * body.qty,
  };
  const delivery = await Expedition.getCost(expedition, services, query);
  if (delivery.length === 0) throw new BadRequestError('No expedition found');
  return delivery[0];
};

BucketController.saveCart = async (bucket, body, product, item, where) => {
  let insuranceCost = 0;
  if (body.is_insurance) {
    const expedition = await Expedition.findById(body.expedition_id);
    insuranceCost = ((product.price * body.qty) * expedition.insurance_fee) / 100;
  }

  const delivery = await BucketController.getCost(body, product);

  const shippingObj = Shipping.matchDBColumn({
    expedition_service_id: body.expedition_service_id,
    address_id: body.address_id,
    delivery_cost: delivery.cost,
    insurance_fee: insuranceCost,
    note: null,
  });

  // TODO: Validation user's address_id
  // TODO: Check qty
  let shippingId;
  if (item) {
    shippingId = item.serialize().shipping_id;
    await Shipping.update(shippingId, shippingObj);
  } else {
    const shipping = await Shipping.create(shippingObj);
    shippingId = shipping.id;
  }

  const itemObj = Item.matchDBColumn({
    shipping_id: shippingId,
    qty: body.qty,
    note: body.note,
    additional_cost: 0, // admin cost
    weight: product.weight * body.qty,
    total_price: (product.price * body.qty) + delivery.cost + insuranceCost,
  });
  return await Item.updateInsert(where, _.assign(itemObj, where));
};

BucketController.addToCart = async (req, res, next) => {
  let dropship;
  let bucket = Bucket.findOrCreateBucket(req.user.id);
  const { productId, storeId } = getProductAndStore(req.body.product_id);
  let product = Product.findById(productId);
  [bucket, product] = await Promise.all([bucket, product]);

  let columns = { bucket_id: bucket.id, product_id: product.id };
  if (product.store_id !== storeId) {
    dropship = await Dropship.findByProductIdAndStoreId(productId, storeId);
    if (!dropship) throw getProductError('product', 'not_found');
    columns = { ...columns, dropshipper_id: dropship.serialize().id };
  }

  const where = Item.matchDBColumn(columns);
  const item = await Item.get(where);
  req.resData = {
    data: await BucketController.saveCart(bucket, req.body, product, item, where),
  };
  return next();
};

BucketController.deleteCart = async (req, res, next) => {
  const bucket = await Bucket.get(req.user.id);
  const item = await Item.get({ id_bucket: bucket.serialize().id, id_listbucket: req.params.id });
  if (!item) throw getItemError('item', 'not_found');
  const shippingId = item.serialize().shipping_id;
  await item.destroy();
  Shipping.where({ id_pengiriman_produk: shippingId }).destroy();
  return next();
};

BucketController.getItem = async (req, res, next) => {
  const bucket = await Bucket.get(req.user.id);
  const item = await Item.getDetail({
    id_bucket: bucket.serialize().id,
    id_listbucket: req.params.id,
  });
  req.resData = {
    message: 'Item data',
    data: item,
  };
  return next();
};

BucketController.checkout = async (req, res, next) => {
  const bucket = await Bucket.getForCheckout(req.user.id);
  let items = bucket.related('items');
  if (items.length === 0) throw getBucketError('bucket', 'not_found_items');

  let totalPrice = 0;
  if (req.body.is_wallet) {
    const bucketObj = bucket.serialize();
    totalPrice = items.reduce((price, item) => (price += item.serialize().total_price), 0);

    let promo = 0;
    if (bucketObj.promo) {
      if (bucketObj.promo.type === PromoType.NOMINAL) {
        promo = bucketObj.promo.nominal / items.length;
      } else promo = (totalPrice * bucketObj.promo.percentage) / 100;
    }

    totalPrice -= promo;
    if (req.user.saldo_wallet < totalPrice) {
      throw new BadRequestError('Saldo tidak mencukupi');
    }
  }

  const groups = _.groupBy(items.models, (val) => {
    val = val.serialize();
    return `${val.product.store_id}#${val.shipping.address_id}#${val.shipping.expedition_service_id}`;
  });

  items = _.map(groups, group => ({
    shipping_id: group[0].serialize().shipping.id,
    store_id: group[0].serialize().product.store_id,
    items: group,
  }));

  await Promise.all(items.map(async (val) => {
    const bucketObj = bucket.serialize();
    const weight = val.items[0].serialize().weight;
    const deliveryCost = val.items[0].serialize().shipping.delivery_cost / Math.ceil(weight / 1000);

    let subTotalPrice = 0;
    let adminCost = 0;
    let insuranceFee = 0;
    let totalWeight = 0;
    _.forEach(val.items, (o) => {
      o = o.serialize();
      subTotalPrice += o.product.price * o.qty;
      adminCost += o.additional_cost;
      insuranceFee += o.shipping.insurance_fee;
      totalWeight += o.weight;
    });

    let promo = 0;
    if (bucketObj.promo) {
      if (bucketObj.promo.type === PromoType.NOMINAL) {
        promo = bucketObj.promo.nominal / items.length;
      } else promo = (subTotalPrice * bucketObj.promo.percentage) / 100;
    }

    const totalDeliveryCost = deliveryCost * Math.ceil(totalWeight / 1000);
    subTotalPrice += (adminCost + insuranceFee + totalDeliveryCost) - promo;

    const invoiceObj = Invoice.matchDBColumn({
      user_id: req.user.id,
      store_id: val.store_id,
      bucket_id: bucketObj.id,
      bid_id: null,
      shipping_id: val.shipping_id,
      payment_method_id: null,
      invoice_number: Invoice.generateNumber(),
      remark_cancel: null,
      bill: subTotalPrice,
      total_price: subTotalPrice,
      delivery_cost: totalDeliveryCost,
      insurance_fee: insuranceFee,
      admin_cost: adminCost,
      wallet: 0, // need confirmation
      promo,
      status: InvoiceStatus.UNPAID,
      confirmed_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const invoice = await Invoice.create(invoiceObj);

    await Promise.all(val.items.map(async item => (
      await item.save({ id_invoice: invoice.serialize().id }, { patch: true })
    )));
  }));

  let bucketData = {
    status_bucket: BucketStatus.CHECKOUT,
    tglstatus_bucket: new Date(),
  };

  if (req.body.is_wallet) {
    bucketData = {
      ...bucketData,
      bayar_wallet: totalPrice,
    };
    await User.updateWallet(req.user.id, req.user.saldo_wallet - totalPrice);
    const type = await TransType.where('kode_tipetransaksi', SummTransType.PAID).fetch();
    const summary = await TransSummary.create(TransSummary.matchDBColumn({
      amount: totalPrice,
      first_saldo: req.user.saldo_wallet,
      last_saldo: req.user.saldo_wallet - totalPrice,
      user_id: req.user.id,
      type: SummTransType.PAID,
      remark: type.get('nama_tipetransaksi'),
    }));
    // TODO: Add detail transaction. (bucket_id)
  }

  await bucket.save(bucketData, { patch: true });
  req.resData = { data: bucket };
  return next();
};

BucketController.bulkUpdate = async (req, res, next) => {
  const bucket = await Bucket.getForCheckout(req.user.id);
  let items = bucket.related('items');
  if (items.length === 0) throw getBucketError('bucket', 'not_found_items');

  items = await Promise.all(req.body.items.map(async (val) => {
    const where = { id_listbucket: val.id };
    const item = await Item.get(where);
    if (!item) throw getItemError('item', 'not_found');
    await item.load('product');
    return await BucketController.saveCart(bucket, val, item.serialize().product, item, where);
  }));

  req.resData = {
    message: 'Items Data',
    data: items,
  };
  return next();
};
