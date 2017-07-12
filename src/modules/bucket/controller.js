import { Bucket, Promo, Item, Shipping } from './model';
import { Product } from '../product/model';
import { Expedition } from '../expedition/model';
import { BadRequestError } from '../../../common/errors';

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
  req.resData = {
    message: 'Count Bucket',
    data: promo,
  };
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

BucketController.addToCart = async (req, res, next) => {
  const body = req.body;
  const bucket = await Bucket.findBucket(req.user.id);
  const product = await Product.findById(body.product_id);
  if (!product) throw new BadRequestError('Product no found');
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
  const shipping = await Shipping.create(shippingObj);
  const itemObj = Item.matchDBColumn({
    bucket_id: bucket.id,
    product_id: product.id,
    shipping_id: shipping.id,
    qty: body.qty,
    note: body.note,
    delivery_cost: body.delivery_cost,
    additional_cost: body.additional_cost,
    weight: product.weight * body.qty,
    total_price: product.price * body.qty,
    final_price: (product.price * body.qty) + body.delivery_cost
    + body.additional_cost + insuranceCost,
    status: 1,
    status_at: new Date(),
  });
  await Item.create(itemObj);
  req.resData = {
    message: 'Success',
  };
  return next();
};
