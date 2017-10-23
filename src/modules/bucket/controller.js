import _ from 'lodash';
import moment from 'moment';
import { Bucket, Promo, Item, Shipping, BucketStatus, PromoType } from './model';
import { Product, Dropship } from '../product/model';
import { Expedition } from '../expedition/model';
import { Invoice, InvoiceStatus, InvoiceTransactionStatus } from '../payment/model';
import { User } from '../user/model';
import { Address } from '../address/model';
import { Store } from '../store/model';
import { Preference } from '../preference/model';
import { addCartError, getBucketError, getItemError, paymentError, addPromoError } from './messages';
import { BadRequestError } from '../../../common/errors';
import { getProductAndStore } from '../core/utils';
import { getProductError } from '../product/messages';
import { SummTransType, TransSummary } from "../saldo/model/transaction_summary";
import { TransType } from "../saldo/model/transaction_type";

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

BucketController.addPromo = async (req, res, next) => {
  const getBucket = Bucket.get(req.user.id);
  const getPromo = Promo.get(req.body.code, req.user.marketplace_id);
  const [bucket, promo] = await Promise.all([getBucket, getPromo]);
  if (Number(promo.get('min_belanja')) > Number(bucket.get('total_tagihan'))) {
    throw addPromoError('total', 'not_enough');
  }
  const checkBucket = await Bucket.query(qb => qb.where('id_users', req.user.id)
      .where('id_promo', promo.get('id_promo'))
      .where('tglstatus_bucket', '>=', promo.get('startdate_promo'))
      .whereIn('status_bucket', [
        BucketStatus.CHECKOUT,
        BucketStatus.WAITING_FOR_PAYMENT,
        BucketStatus.WAITING_FOR_VERIFICATION,
        BucketStatus.PAYMENT_RECEIVED,
      ])).fetch();
  if (checkBucket) throw addPromoError('promo', 'used');
  await bucket.save({ id_promo: promo.get('id_promo') }, { patch: true });
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

  if (product.is_discount) {
    product.price -= product.price * (product.discount / 100);
  }

  if (body.is_insurance) {
    const expedition = await Expedition.findById(body.expedition_id);
    insuranceCost = product.price * body.qty * (expedition.insurance_fee / 100);
  }

  const delivery = await BucketController.getCost(body, product);

  const shippingObj = Shipping.matchDBColumn({
    expedition_service_id: body.expedition_service_id,
    address_id: body.address_id,
    delivery_cost: delivery.cost,
    insurance_fee: insuranceCost,
    is_insurance: body.is_insurance,
    note: null,
  });

  let shippingId;
  let prevBill = 0;
  let update = true;
  if (item) {
    shippingId = item.get('id_pengiriman_produk');
    const prevQty = Number(item.get('qty_listbucket'));
    prevBill = prevQty !== body.qty ? prevQty * product.price : 0;
    update = prevBill !== 0;
    await Shipping.update(shippingId, shippingObj);
  } else {
    const shipping = await Shipping.create(shippingObj);
    shippingId = shipping.id;
  }
  const bill = product.price * body.qty;

  const itemObj = Item.matchDBColumn({
    shipping_id: shippingId,
    qty: body.qty,
    note: body.note,
    additional_cost: 0, // admin cost
    weight: product.weight * body.qty,
    total_price: (product.price * body.qty) + delivery.cost + insuranceCost,
  });
  const getNewItem = Item.updateInsert(where, _.assign(itemObj, where));
  const updateBucket = update ? bucket.updateBill(bill, prevBill) : null;
  const [newItem] = await Promise.all([getNewItem, updateBucket]);
  return newItem;
};

BucketController.addToCart = async (req, res, next) => {
  let dropship;
  const getBucket = Bucket.findOrCreateBucket(req.user.id);
  const getAddress = Address.where({
    id_users: req.user.id,
    id_alamatuser: req.body.address_id,
  }).fetch();
  const { productId, storeId } = getProductAndStore(req.body.product_id);
  const getProduct = Product.findById(productId);
  const getStore = Store.where('id_users', req.user.id).fetch();

  const [bucket, product, address, store] = await Promise.all([
    getBucket,
    getProduct,
    getAddress,
    getStore,
  ]);

  const ownStoreId = store ? store.get('id_toko') : null;
  if (!address) throw addCartError('address', 'address_not_found');
  if (req.body.qty > product.stock) throw addCartError('cart', 'stock', true);
  if (ownStoreId && ownStoreId === storeId) throw addCartError('product', 'not_valid');

  const columns = { bucket_id: bucket.id, product_id: product.id, dropshipper_id: null };
  if (product.store_id !== storeId) {
    dropship = await Dropship.findByProductIdAndStoreId(productId, storeId);
    if (dropship.get('id_toko') === ownStoreId) throw addCartError('product', 'not_valid');
    if (!dropship) throw getProductError('product', 'not_found');
    columns.dropshipper_id = dropship.get('id_dropshipper');
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
  const item = await Item.where({ id_bucket: bucket.get('id_bucket'), id_listbucket: req.params.id })
    .fetch({ withRelated: ['shipping'] });
  if (!item) throw getItemError('item', 'not_found');
  const { shipping, total_price: bill } = item.serialize();
  const itemBill = bill - (shipping.delivery_cost + shipping.insurance_fee);
  const totalBill = bucket.get('total_tagihan') - itemBill;
  await Promise.all([item.destroy(), bucket.save({ total_tagihan: totalBill }, { patch: true })]);
  Shipping.where({ id_pengiriman_produk: shipping.id }).destroy();
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
  const items = bucket.related('items');
  if (items.length === 0) throw getBucketError('bucket', 'not_found_items');

  const groups = _.groupBy(items.models, (val) => {
    const { product, shipping, dropship = {} } = val.serialize();
    const id = dropship.store_id || '';
    return `${product.store_id}#${shipping.address_id}#${shipping.expedition_service_id}#${id}`;
  });

  const itemGroups = _.map(groups, group => ({
    shipping_id: group[0].serialize().shipping.id,
    store_id: group[0].serialize().product.store_id,
    items: group,
  }));

  const bucketObj = bucket.serialize();
  let totalPrice = 0;

  await Promise.all(itemGroups.map(async (group) => {
    const firstItem = group.items[0].serialize();
    const weight = firstItem.weight;
    const deliveryCost = firstItem.shipping.delivery_cost / Math.ceil(weight / 1000);

    let subTotalPrice = 0;
    let adminCost = 0;
    let insuranceFee = 0;
    let totalWeight = 0;
    _.forEach(group.items, (o) => {
      o = o.serialize();
      subTotalPrice += o.product.price * o.qty;
      adminCost += o.additional_cost;
      insuranceFee += o.shipping.insurance_fee;
      totalWeight += o.weight;
    });

    const totalDeliveryCost = deliveryCost * Math.ceil(totalWeight / 1000);
    subTotalPrice += adminCost + insuranceFee + totalDeliveryCost;
    totalPrice += subTotalPrice;

    const invoiceObj = Invoice.matchDBColumn({
      user_id: req.user.id,
      store_id: group.store_id,
      bucket_id: bucketObj.id,
      bid_id: null,
      shipping_id: group.shipping_id,
      payment_method_id: null,
      invoice_number: Invoice.generateNumber(),
      remark_cancel: null,
      bill: subTotalPrice,
      total_price: subTotalPrice,
      delivery_cost: totalDeliveryCost,
      insurance_fee: insuranceFee,
      admin_cost: adminCost,
      wallet: 0, // need confirmation
      status: InvoiceStatus.UNPAID,
      confirmed_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const invoice = await Invoice.create(invoiceObj);

    await Promise.all(group.items.map(item => (
      item.save({ id_invoice: invoice.serialize().id }, { patch: true })
    )));
  }));

  let promo = 0;
  if (bucketObj.promo) {
    if (bucketObj.promo.type === PromoType.NOMINAL) {
      promo = bucketObj.promo.nominal;
    } else promo = (totalPrice * bucketObj.promo.percentage) / 100;
  }
  totalPrice -= promo;
  totalPrice += bucketObj.unique_code;

  const bucketData = {
    status_bucket: BucketStatus.WAITING_FOR_PAYMENT,
    tglstatus_bucket: new Date(),
    total_tagihan: totalPrice,
  };

  await bucket.save(bucketData, { patch: true });
  req.resData = { data: bucket };
  return next();
};

BucketController.bulkUpdate = async (req, res, next) => {
  const { items: bodies } = req.body;
  const bucket = await Bucket.where({ id_users: req.user.id,
    status_bucket: BucketStatus.ADDED }).fetch();
  const getItems = bodies.map(item => Item.get({ id_listbucket: item.id,
    id_bucket: bucket.get('id_bucket') }, 'product'));

  const items = await Promise.all(getItems.map(async (getItem, idx) => {
    const item = await getItem;
    if (!item) throw getItemError('item', 'not_found');
    const product = item.serialize().product;
    if (bodies[idx].qty > product.stock) throw addCartError('cart', 'stock', true);
    const where = { id_listbucket: item.get('id_listbucket') };
    return await BucketController.saveCart(bucket, bodies[idx], product, item, where);
  }));

  req.resData = {
    message: 'Items Data',
    data: items,
  };
  return next();
};

BucketController.balancePayment = async (req, res, next) => {
  const now = moment();
  const getBucket = Bucket.where({
    id_bucket: req.params.id,
    id_users: req.user.id,
    status_bucket: BucketStatus.WAITING_FOR_PAYMENT,
  }).fetch();
  const getPref = Preference.get('payment');
  const [bucket, pref] = await Promise.all([getBucket, getPref]);
  if (!bucket) throw paymentError('transaction', 'not_found');
  const expired = moment(bucket.get('tglstatus_bucket')).add(pref.value, 'days');
  if (now > expired) throw paymentError('transaction', 'not_found');
  const bill = Number(bucket.get('total_tagihan'));
  const saldo = req.user.saldo_wallet - bill;
  if (saldo < 0) throw paymentError('saldo', 'not_enough');

  await bucket.save({
    status_bucket: BucketStatus.PAYMENT_RECEIVED,
    tglstatus_bucket: now,
    bayar_wallet: bill,
  }, { patch: true });

  await Invoice.where('id_bucket', bucket.get('id_bucket')).save({
    status_invoice: InvoiceStatus.PAID,
    updated_at: now,
    status_transaksi: InvoiceTransactionStatus.WAITING,
  }, { patch: true });

  const remark = await TransType.getRemark(SummTransType.PAYMENT);
  await TransSummary.create(TransSummary.matchDBColumn({
    amount: bill,
    first_saldo: saldo + bill,
    last_saldo: saldo,
    user_id: req.user.id,
    type: SummTransType.PAYMENT,
    remark,
    summaryable_type: 'bucket',
    summaryable_id: bucket.get('id_bucket'),
  }));

  await User.where('id_users', req.user.id).save({ saldo_wallet: saldo }, { patch: true });
  return next();
};
