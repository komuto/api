import _ from 'lodash';
import Doku from 'doku';
import moment from 'moment';
import {
  PaymentMethod,
  PaymentConfirmation,
  PaymentConfirmationStatus,
} from './model';
import { Bucket, BucketStatus } from './../bucket/model';
import { BankAccount } from '../bank/model';
import config from '../../../config';

const doku = new Doku(config.mallId, config.sharedKey);

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

PaymentController.getDokuData = async (req, res, next) => {
  const total = await Bucket.getTotalPrice(req.user.id);
  const amount = `${total}.00`;
  const invoice = 'INVOICE_00001';
  const currency = '360';
  const words = doku.doCreateWords({ amount, invoice, currency });
  req.resData = {
    message: 'Doku Data',
    data: {
      invoice,
      currency,
      amount,
      words,
      chain_merchant: 'NA',
    },
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
