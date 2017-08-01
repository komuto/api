import _ from 'lodash';
import { Bucket, Promo, Item, Shipping } from './model';
import { Product } from '../product/model';
import { Expedition } from '../expedition/model';

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
  await Item.updateInsert(where, _.assign(where, itemObj));
};

BucketController.addToCart = async (req, res, next) => {
  const bucket = await Bucket.findBucket(req.user.id);
  this.saveCart(bucket, req.body);
  return next();
};

BucketController.checkout = async (req, res, next) => {
  const buckets = req.body.buckets;
  const bucket = await Bucket.findBucket(req.user.id);

  await Promise.all(buckets.forEach(async (val) => {
    await this.saveCart(bucket, val);
  }));

  return next();
};
