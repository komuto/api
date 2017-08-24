import _ from 'lodash';
import Midtrans from 'midtrans-nodex';
import moment from 'moment';
import randomInt from 'random-int';
import {
  PaymentMethod,
  PaymentConfirmation,
  PaymentConfirmationStatus,
} from './model';
import { Bucket, BucketStatus } from './../bucket/model';
import { BankAccount } from '../bank/model';
import config from '../../../config';
import core from '../core';

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
      price: item.total_price,
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
    message: 'Transactions Data',
    data: bucket,
  };
  return next();
};
