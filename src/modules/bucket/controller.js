import _ from 'lodash';
import { Bucket, Promo, Item, Shipping, BucketStatus, PromoType } from './model';
import { Product } from '../product/model';
import { Expedition } from '../expedition/model';
import { Invoice, InvoiceStatus } from '../invoice/model';

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
  const promo = await Promo.get(req.query.code);
  const bucket = await Bucket.findBucket(req.user.id);
  await Bucket.addPromo(bucket.toJSON().id, promo.toJSON().id);
  req.resData = {
    message: 'Promo Data',
    data: promo,
  };
  return next();
};

BucketController.cancelPromo = async (req, res, next) => {
  const bucket = await Bucket.findBucket(req.user.id);
  await Bucket.cancelPromo(bucket.toJSON().id);
  return next();
};

BucketController.getBucket = async (req, res, next) => {
  const bucket = await Bucket.get(req.user.id);
  req.resData = {
    message: 'Bucket Data',
    data: bucket,
  };
  return next();
};

BucketController.saveCart = async (bucket, body) => {
  const product = await Product.findById(body.product_id);

  const where = Item.matchDBColumn({ bucket_id: bucket.id, product_id: product.id });
  const item = await Item.get(where);

  let insuranceCost = 0;
  if (body.is_insurance) {
    const expedition = await Expedition.findById(body.expedition_id);
    insuranceCost = ((product.price * body.qty) * expedition.insurance_fee) / 100;
  }
  const shippingObj = Shipping.matchDBColumn({
    expedition_service_id: body.expedition_service_id,
    address_id: body.address_id,
    delivery_cost: body.delivery_cost,
    insurance_fee: insuranceCost,
    note: null,
  });

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
    total_price: (product.price * body.qty) + body.delivery_cost + insuranceCost,
  });
  return await Item.updateInsert(where, _.assign(itemObj, where));
};

BucketController.addToCart = async (req, res, next) => {
  const bucket = await Bucket.findBucket(req.user.id);
  await BucketController.saveCart(bucket, req.body);
  return next();
};

BucketController.checkout = async (req, res, next) => {
  const buckets = req.body.buckets;
  const bucket = await Bucket.findBucket(req.user.id);
  await bucket.load('promo');

  const items = await Promise.all(buckets.map(async val => (
    await BucketController.saveCart(bucket, val)
  )));

  let data = await Promise.all(items.map(async (item) => {
    await item.load('product');
    await item.load('shipping');
    return item;
  }));

  const groups = _.groupBy(data, (val) => {
    val = val.serialize();
    return `${val.product.store_id}#${val.shipping.address_id}#${val.shipping.expedition_service_id}`;
  });

  data = _.map(groups, group => ({
    shipping_id: group[0].serialize().shipping.id,
    store_id: group[0].serialize().product.store_id,
    items: group,
  }));

  await Promise.all(data.map(async (val) => {
    const bucketObj = bucket.serialize();
    const weight = val.items[0].serialize().weight;
    const deliveryCost = val.items[0].serialize().shipping.delivery_cost / Math.ceil(weight / 1000);

    let totalPrice = 0;
    let adminCost = 0;
    let insuranceFee = 0;
    let totalWeight = 0;
    _.forEach(val.items, (o) => {
      o = o.serialize();
      totalPrice += o.product.price * o.qty;
      adminCost += o.additional_cost;
      insuranceFee += o.shipping.insurance_fee;
      totalWeight += o.weight;
    });

    let promo = 0;
    if (bucketObj.promo !== undefined) {
      if (bucketObj.promo.type === PromoType.NOMINAL) promo = bucketObj.promo.nominal / data.length;
      else promo = (totalPrice * bucketObj.promo.percentage) / 100;
    }

    const totalDeliveryCost = deliveryCost * Math.ceil(totalWeight / 1000);
    totalPrice += adminCost + insuranceFee + totalDeliveryCost;

    const invoiceObj = Invoice.matchDBColumn({
      user_id: req.user.id,
      store_id: val.store_id,
      bucket_id: bucketObj.id,
      bid_id: null,
      shipping_id: val.shipping_id,
      payment_method_id: bucketObj.payment_method,
      invoice_number: Invoice.generateNumber(),
      remark_cancel: null,
      bill: totalPrice,
      total_price: totalPrice,
      delivery_cost: totalDeliveryCost,
      insurance_fee: insuranceFee,
      admin_cost: adminCost,
      wallet: bucketObj.wallet, // need confirmation
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

    return await bucket.save({ status_bucket: BucketStatus.CHECKOUT }, { patch: true });
  }));

  return next();
};
