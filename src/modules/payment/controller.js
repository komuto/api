import _ from 'lodash';
import sha1 from 'sha1';
import Doku from 'doku';
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
  const invoice = `INVOICE_${randomInt(10000, 99999)}`;
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

PaymentController.store = async (req, res, next) => {
  const token = req.body.token;
  const pairingCode = req.body.pairing_code;
  const invoiceNo = req.body.invoice_no;
  const amount = '10000.00';

  const params = {
    token,
    amount,
    invoice: invoiceNo,
    currency: '360',
    pairing_code: pairingCode,
  };

  const words = doku.doCreateWords(params);

  const basket = [
    {
      name: 'sayur',
      amount: '10000.00',
      quantity: '1',
      subtotal: '10000.00',
    },
  ];

  const customer = {
    name: req.user.name,
    data_phone: req.user.phone_number,
    data_email: req.user.email,
    data_address: 'yogyakarta',
  };

  const date = moment().format('YMMDDHHmmss');

  const dataPayment = {
    req_mall_id: doku.getMallId(),
    req_chain_merchant: 'NA',
    req_amount: amount,
    req_words: words,
    req_purchase_amount: amount,
    req_trans_id_merchant: invoiceNo,
    req_request_date_time: date,
    req_currency: '360',
    req_purchase_currency: '360',
    req_session_id: sha1(date),
    req_name: customer.name,
    req_payment_channel: 15,
    req_basket: doku.formatBasket(basket),
    req_email: customer.email,
    req_token_id: token,
  };

  doku.doPayment(dataPayment, (response) => {
    const obj = JSON.parse(JSON.stringify(response));
    if (obj.res_response_msg === 'SUCCESS' && obj.res_response_code === '0000') {
      console.log('SUCCESS RESPONSE', obj);
    } else {
      console.log('FAILED RESPONSE', obj);
    }
    req.resData = { data: obj };
    return next();
  });
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
