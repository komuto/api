import _ from 'lodash';
import { Bucket, Promo, Item, Shipping } from './model';
import { Product } from '../product/model';
import { Expedition } from '../expedition/model';
import { Invoice } from '../invoice/model';

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
    note: body.note,
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

  const items = await Promise.all(buckets.map(async val => (
    await BucketController.saveCart(bucket, val)
  )));

  let data = await Promise.all(items.map(async (item) => {
    item = await item.load('product');
    return item.serialize();
  }));

  data = _.chain(data)
    .groupBy('product.store_id')
    .toPairs()
    .map(currentItem => (_.zipObject(['store_id', 'items'], currentItem)))
    .value();

  await Promise.all(data.map(async (val) => {
    
  }));
  //
  // const invoiceObj = Invoice.matchDBColumn({
  //   user_id: req.user.id,
  //   store_id: 'id_toko',
  //   bucket_id: 'id_bucket',
  //   bid_id: 'id_bidlelang',
  //   shipping_id: 'id_pengiriman_produk',
  //   invoice_number: 'no_invoice',
  //   payment_method_id: 'id_paymentmethod',
  //   remark_cancel: 'remark_pembatalan',
  //   bill: 'total_tagihan',
  //   total_price: 'total_harga',
  //   delivery_cost: 'biaya_ongkir',
  //   insurance_fee: 'biaya_asuransi',
  //   admin_cost: 'biaya_admin',
  //   wallet: 'bayar_wallet',
  //   promo: 'promo',
  //   status: 'status_invoice',
  //   created_at: 'createdate_invoice',
  //   confirmed_at: 'confirmation_date',
  //   updated_at: 'confirmation_date',
  // });
  // const invoice = await Invoice.create(invoiceObj);
  // req.resData = { data: invoice };
  return next();
};
