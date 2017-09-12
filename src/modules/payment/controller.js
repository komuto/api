import _ from 'lodash';
import Midtrans from 'midtrans-nodex';
import moment from 'moment';
import randomInt from 'random-int';
import {
  PaymentMethod,
  PaymentConfirmation,
  PaymentConfirmationStatus,
  Invoice,
  InvoiceTransactionStatus,
  Dispute,
  DisputeResponseStatus,
  DisputeStatus,
  DisputeProduct,
} from './model';
import { Bucket, BucketStatus } from './../bucket/model';
import { BankAccount } from '../bank/model';
import config from '../../../config';
import core from '../core';
import { Review } from '../review/model';
import { ImageGroup } from '../user/model';
import nominal from '../../../config/nominal.json';
import { getNominalError } from './messages';

const midtrans = new Midtrans({
  clientKey: config.midtrans.clientKey,
  serverKey: config.midtrans.serverKey,
  isProduction: config.midtrans.isProduction,
});
const { getName } = core.utils;

export const PaymentController = {};
export default { PaymentController };

PaymentController.getMethods = async (req, res, next) => {
  req.resData = {
    message: 'Payment Methods Data',
    data: await PaymentMethod.getAll(),
  };
  return next();
};

PaymentController.viaBank = async (req, res, next) => {
  const bucket = await Bucket.findByIdAndStatus(
    req.params.id,
    req.user.id,
    BucketStatus.CHECKOUT,
  );
  await BankAccount.checkKomutoAccount(req.body.bank_account_id);
  await PaymentConfirmation.checkDuplicate(bucket.serialize().id);
  const data = PaymentConfirmation.matchDBColumn(_.assign(req.body, {
    bucket_id: bucket.serialize().id,
    user_id: req.user.id,
    status: PaymentConfirmationStatus.DRAFT,
    date: moment.unix(req.body.date),
  }));
  const paymentConfirmation = await PaymentConfirmation.create(data);
  req.resData = {
    message: 'success',
    data: paymentConfirmation,
  };
  return next();
};

PaymentController.getSnapToken = async (req, res, next) => {
  const bucket = await Bucket.getDetail(req.user.id);
  let total = 0;
  const itemDetails = bucket.items.map((item) => {
    total += item.total_price;
    return {
      id: `ITEM-${item.id}`,
      price: item.total_price / item.qty,
      quantity: item.qty,
      name: item.product.name,
    };
  });
  const { firstName, lastName } = getName(req.user.name);
  const payload = {
    transaction_details: {
      order_id: `ORDER-${randomInt(10000, 99999)}`,
      gross_amount: total,
    },
    item_details: itemDetails,
    customer_details: {
      first_name: firstName,
      last_name: lastName,
      email: req.user.email,
      phone: req.user.phone_number,
    },
  };
  const token = await midtrans.snap.transactions(payload);
  req.resData = {
    message: 'Snap Token',
    data: token.data,
  };
  return next();
};

PaymentController.getSaldoSnapToken = async (req, res, next) => {
  const found = _.find(nominal, o => o.id === parseInt(req.params.id, 10));
  if (!found) throw getNominalError('nominal', 'not_found');
  const { firstName, lastName } = getName(req.user.name);
  const payload = {
    transaction_details: {
      order_id: `TOPUP-${randomInt(10000, 99999)}`,
      gross_amount: found.amount,
    },
    customer_details: {
      first_name: firstName,
      last_name: lastName,
      email: req.user.email,
      phone: req.user.phone_number,
    },
  };
  const token = await midtrans.snap.transactions(payload);
  req.resData = {
    message: 'Snap Token',
    data: token.data,
  };
  return next();
};

PaymentController.listTransactions = async (req, res, next) => {
  const buckets = await Bucket.listTransactions(req.user.id);
  req.resData = {
    message: 'Transactions Data',
    data: buckets,
  };
  return next();
};

PaymentController.detailTransaction = async (req, res, next) => {
  const bucket = await Bucket.detailTransaction(req.user.id, req.params.id);
  req.resData = {
    message: 'Transaction Data',
    data: bucket,
  };
  return next();
};

PaymentController.detailInvoice = async (req, res, next) => {
  const invoice = await Invoice.detail(req.user.id, req.params.id, req.params.invoice_id);
  req.resData = {
    message: 'Invoice Data',
    data: invoice,
  };
  return next();
};

PaymentController.bulkReview = async (req, res, next) => {
  const reviews = await Review.bulkCreate({
    user_id: req.user.id,
    bucket_id: req.params.id,
    invoice_id: req.params.invoice_id,
    reviews: req.body,
  });
  await Invoice.updateStatus(req.params.invoice_id, InvoiceTransactionStatus.RECEIVED);
  req.resData = {
    message: 'Reviews Data',
    data: reviews,
  };
  return next();
};

PaymentController.dispute = async (req, res, next) => {
  const invoice = await Invoice.get(req.user.id, req.params.id, req.params.invoice_id, 'items.product');
  const items = invoice.related('items').map(item => ({
    ...item.serialize(),
    product: item.related('product').serialize(),
  }));
  const problems = req.body.problems.map(problem => ({ problem }));
  const data = Dispute.matchDBColumn({
    user_id: req.user.id,
    store_id: invoice.serialize().store_id,
    invoice_id: invoice.serialize().id,
    invoice_type: 1, // default
    solution: req.body.solution,
    problems,
    note: req.body.note,
    dispute_number: `${randomInt(1000, 9999)}-${moment().format('DD/MM/YYYY')}`,
    status: DisputeStatus.NEW,
    response_status: DisputeResponseStatus.NO_RESPONSE_YET,
    response_at: moment(),
    created_at: moment(),
  });
  const dispute = await Dispute.create(data);
  await DisputeProduct.bulkCreate(dispute.serialize().id, req.body.products, items);
  if (req.body.images) await ImageGroup.bulkCreate(dispute.get('id_dispute'), req.body.images, 'dispute');
  await Invoice.updateStatus(invoice.serialize().id, InvoiceTransactionStatus.PROBLEM);
  req.resData = { data: dispute };
  return next();
};

PaymentController.getDisputes = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const disputes = await Dispute.getAll({ id_users: req.user.id }, page, pageSize);
  req.resData = {
    message: 'Dispute Data',
    meta: { page, limit: pageSize },
    data: disputes,
  };
  return next();
};

PaymentController.notification = async (req, res, next) => {
  let data = '';
  req.on('data', (chunk) => { data += chunk; });
  req.on('end', () => {
    req.body = data ? JSON.parse(data) : {};
    if (typeof req.body === 'string') req.body = JSON.parse(req.body);
    console.log('\n=== MIDTRANS ===');
    console.log(req.body);
    console.log('\n');
    return next();
  });
};
