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
  DisputeSolutionType,
} from './model';
import { Bucket, BucketStatus, Shipping, Refund, RefundStatus, RefundItem } from './../bucket/model';
import { BankAccount } from '../bank/model';
import { Store } from '../store/model';
import config from '../../../config';
import core from '../core';
import { Review } from '../review/model';
import { ImageGroup } from '../user/model';
import nominal from '../../../config/nominal.json';
import {
  getNominalError,
  getInvoiceError,
  acceptOrderError,
  rejectOrderError,
  inputBillError,
  errMsg,
} from './messages';
import { getStoreError } from './../store/messages';
import { Topup } from '../saldo/model';
import { BadRequestError } from './../../../common/errors';
import messages from '../core/messages';
import { Preference } from '../preference/model';
import { paymentError } from '../bucket/messages';
import { TransactionLog } from "./model/transaction_log";

const { buyerNotification, Notification, sellerNotification } = core;
const { validateImageUrl } = core.middleware;

const midtrans = new Midtrans({
  clientKey: config.midtrans.clientKey,
  serverKey: config.midtrans.serverKey,
  isProduction: config.midtrans.isProduction,
});
const { getName, getProductAndStore } = core.utils;

export const PaymentController = {};
export default { PaymentController };

PaymentController.getMethods = async (req, res, next) => {
  req.resData = {
    message: 'Payment Methods Data',
    data: await PaymentMethod.getAll(),
  };
  return next();
};

// Unused
PaymentController.viaBank = async (req, res, next) => {
  const bucket = await Bucket.findByIdAndStatus(
    req.params.id,
    req.user.id,
    BucketStatus.CHECKOUT,
  );
  await BankAccount.checkKomutoAccount(req.body.bank_account_id);
  await PaymentConfirmation.checkDuplicate(bucket.id);
  const data = PaymentConfirmation.matchDBColumn(_.assign(req.body, {
    bucket_id: bucket.id,
    user_id: req.user.id,
    status: PaymentConfirmationStatus.DRAFT,
    date: moment.unix(req.body.date),
  }));
  const paymentConfirmation = await PaymentConfirmation.create(data);
  req.resData = { data: paymentConfirmation };
  return next();
};

PaymentController.getSnapToken = async (req, res, next) => {
  const [bucketModel, limit] = await Promise.all([
    await Bucket.getForPayment(req.user.id, req.params.id, req.query.platform),
    await Preference.get('payment'),
  ]);
  const bucket = bucketModel.serialize();
  const endDate = moment.unix(bucket.order_at).add(limit.value, 'd');
  if (endDate.diff(moment(), 'd') < 0) throw paymentError('transaction', 'not_found');
  const { firstName, lastName } = getName(req.user.name);
  const payload = {
    transaction_details: {
      order_id: `ORDER-${bucket.id}`,
      gross_amount: bucket.total_bill,
    },
    customer_details: {
      first_name: firstName,
      last_name: lastName,
      email: req.user.email,
      phone: req.user.phone_number,
    },
  };
  const token = await midtrans.snap.transactions(payload).catch(() => {
    throw new BadRequestError('Midtrans error');
  });
  req.resData = {
    message: 'Snap Token',
    data: token.data,
  };
  return next();
};

PaymentController.getSaldoSnapToken = async (req, res, next) => {
  const found = _.find(nominal, o => o.id === parseInt(req.params.id, 10));
  if (!found) throw getNominalError('nominal', 'not_found');
  const data = Topup.matchDBColumn({
    user_id: req.user.id,
    payment_method_id: 1, // default value
    amount: found.amount,
    platform: req.query.platform,
  });
  const topup = await Topup.create(data);
  const { firstName, lastName } = getName(req.user.name);
  const payload = {
    transaction_details: {
      order_id: `TOPUP-${topup.get('id')}`,
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
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const buckets = await Bucket.listTransactions(req.user.id, page, pageSize);
  req.resData = {
    message: 'Transactions Data',
    meta: { page, limit: pageSize },
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
  const invoice = await Invoice.updateStatus(
    req.params.invoice_id,
    InvoiceTransactionStatus.RECEIVED,
  );
  await invoice.refresh({ withRelated: ['store.user', 'items'] });

  const seller = invoice.related('store.user');
  if (seller.get('reg_token')) {
    Notification.send(
      sellerNotification.ORDER_RECEIVED,
      seller.get('reg_token'),
      req.marketplace,
      { invoice_id: String(invoice.id), click_action: `order-detail?id=${invoice.id}` },
    );
  }

  req.resData = {
    message: 'Reviews Data',
    data: reviews,
  };
  return next();
};

PaymentController.dispute = async (req, res, next) => {
  if (req.body.images) {
    req.body.images.map(img => validateImageUrl(img.name, errMsg.createDispute.image));
  }
  const invoice = await Invoice.get(
    req.user.id,
    req.params.id,
    req.params.invoice_id,
    ['items.product', 'store.user'],
    req.body.solution,
  );
  const invoiceObj = invoice.serialize();
  const items = invoice.related('items').map(item => ({
    ...item.serialize(),
    product: item.related('product').serialize(),
  }));
  const problems = req.body.problems.map(problem => ({ problem }));
  const disputeNumber = `${randomInt(1000, 9999)}-${moment().format('DD/MM/YYYY')}`;
  const data = Dispute.matchDBColumn({
    user_id: req.user.id,
    store_id: invoiceObj.store_id,
    invoice_id: invoiceObj.id,
    invoice_type: 1, // default
    solution: req.body.solution,
    problems,
    note: req.body.note,
    dispute_number: disputeNumber,
    status: DisputeStatus.NEW,
    response_status: DisputeResponseStatus.NO_RESPONSE_YET,
    response_at: moment().toDate(),
    created_at: moment().toDate(),
  });
  const dispute = await Dispute.create(data);
  await DisputeProduct.bulkCreate(dispute.id, req.body.products, items);
  if (req.body.images) await ImageGroup.bulkCreate(dispute.get('id_dispute'), req.body.images, 'dispute');
  if (req.body.solution === DisputeSolutionType.REFUND) {
    let totalRefund = 0;
    req.body.products.forEach(async (val) => {
      const { productId } = getProductAndStore(val);
      const item = _.find(items, o => o.product.id === productId);
      if (!item) return;
      totalRefund += item.product.price;
    });
    const refundData = Refund.matchDBColumn({
      bucket_id: invoiceObj.bucket_id,
      invoice_id: invoiceObj.id,
      dispute_id: dispute.id,
      refund_number: `RF${disputeNumber}`,
      total: totalRefund,
      status: RefundStatus.PROCEED,
    });
    const refund = await Refund.create(refundData);
    await RefundItem.bulkCreate(refund.id, req.body.products, items);
  }
  await Invoice.updateStatus(invoiceObj.id, InvoiceTransactionStatus.PROBLEM);

  const notificationType = req.body.solution === DisputeSolutionType.REFUND
    ? sellerNotification.ORDER_COMPLAINED_REFUND
    : sellerNotification.ORDER_COMPLAINED_EXCHANGE;
  const seller = invoice.related('store').related('user');
  if (seller.get('reg_token')) {
    Notification.send(
      notificationType,
      seller.get('reg_token'),
      req.marketplace,
      { dispute_id: String(dispute.id), click_action: `complain-seller-detail?id=${dispute.id}` },
    );
  }

  req.resData = { data: dispute };
  return next();
};

PaymentController.getDisputes = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const isResolved = req.query.is_resolved ? JSON.parse(req.query.is_resolved) : false;
  const disputes = await Dispute.getAll({
    where: { id_users: req.user.id },
    is_resolved: isResolved,
    page,
    pageSize,
    userId: req.user.id,
  });
  req.resData = {
    message: 'Dispute Data',
    meta: { page, limit: pageSize },
    data: disputes,
  };
  return next();
};

PaymentController.getDispute = async (req, res, next) => {
  const where = { id_users: req.user.id, id_dispute: req.params.id };
  const dispute = await Dispute.getDetail(where, req.user.id);
  req.resData = {
    message: 'Dispute Data',
    data: dispute,
  };
  return next();
};

PaymentController.createDisputeDiscussion = async (req, res, next) => {
  const where = { id_users: req.user.id, id_dispute: req.params.id };
  const message = await Dispute.createDiscussion(where, req.user.id, req.body.content);
  req.resData = { data: message };
  return next();
};

PaymentController.confirmDispute = async (req, res, next) => {
  const dispute = await Dispute.bulkReviewProducts(
    req.params.id,
    req.user.id,
    req.body,
    req.marketplace,
  );
  req.resData = { data: dispute };
  return next();
};

PaymentController.buyerRefund = async (req, res, next) => {
  const dispute = await Dispute.refund(req.params.id, req.user.id);
  req.resData = { data: dispute };
  return next();
};

PaymentController.getStoreDisputes = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const isResolved = req.query.is_resolved ? JSON.parse(req.query.is_resolved) : false;
  const storeId = await Store.getStoreId(req.user.id);
  const disputes = await Dispute.getAll({
    where: { id_toko: storeId },
    is_resolved: isResolved,
    page,
    pageSize,
    userId: req.user.id,
  });
  req.resData = {
    message: 'Dispute Data',
    meta: { page, limit: pageSize },
    data: disputes,
  };
  return next();
};

PaymentController.getStoreDispute = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const where = { id_toko: storeId, id_dispute: req.params.id };
  const dispute = await Dispute.getDetail(where, req.user.id);
  req.resData = {
    message: 'Dispute Data',
    data: dispute,
  };
  return next();
};

PaymentController.createStoreDisputeDiscussion = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const where = { id_toko: storeId, id_dispute: req.params.id };
  const message = await Dispute.createDiscussion(where, req.user.id, req.body.content);
  req.resData = { data: message };
  return next();
};

PaymentController.updateAirwayBill = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const where = { id_toko: storeId, id_dispute: req.params.id };
  const dispute = await Dispute.updateAirwayBill(where, req.body.airway_bill);
  req.resData = { data: dispute };
  return next();
};

PaymentController.confirmStoreDispute = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const dispute = await Dispute.storeReceived(req.params.id, storeId);
  req.resData = { data: dispute };
  return next();
};

PaymentController.notification = async (req, res, next) => {
  let data = '';
  req.on('data', (chunk) => { data += chunk; });
  req.on('end', async () => {
    try {
      req.body = data ? JSON.parse(data) : {};
      if (typeof req.body === 'string') req.body = JSON.parse(req.body);
      const [type, id] = req.body.order_id.split('-');
      if (type === 'ORDER') {
        const bucket = await Bucket.midtransNotification(id, req.body);
        console.log(type, bucket.serialize());
      } else {
        const topup = await Topup.midtransNotification(id, req.body);
        console.log(type, topup.serialize());
      }
    } catch (e) {
      TransactionLog.create({
        order_id: 0,
        transaction_name: 'ERROR',
        payment_method: 'midtrans',
        response_data: req.body,
        status: '-',
      });

      req.resData = {
        code: messages.something_wrong.code,
        status: false,
        message: messages.something_wrong.msg,
      };
    }
    console.log('\n=== MIDTRANS ===');
    console.log(req.body);
    console.log('\n');
    console.log('\n');
    return next();
  });
};

PaymentController.getNewOrders = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const storeId = await Store.getStoreId(req.user.id);
  const invoices = await Invoice.getOrders(
    storeId,
    InvoiceTransactionStatus.WAITING,
    page,
    pageSize,
    );
  req.resData = {
    message: 'New Orders Data',
    meta: { page, limit: pageSize },
    data: invoices,
  };
  return next();
};

PaymentController.getNewOrderDetail = async (req, res, next) => {
  const store = await Store.where('id_users', req.user.id).fetch();
  const invoice = await Invoice
    .getOrderDetail(req.params.id, store, InvoiceTransactionStatus.WAITING);
  if (!invoice) throw getInvoiceError('invoice', 'not_found');
  req.resData = {
    message: 'New Order Detail Data',
    data: invoice,
  };
  return next();
};

PaymentController.getProcessingOrders = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const storeId = await Store.getStoreId(req.user.id);
  const invoices = await Invoice.getOrders(
    storeId,
    InvoiceTransactionStatus.PROCEED,
    page,
    pageSize,
    );
  req.resData = {
    message: 'Processing Orders Data',
    meta: { page, limit: pageSize },
    data: invoices,
  };
  return next();
};

PaymentController.getProcessingOrderDetail = async (req, res, next) => {
  const store = await Store.where('id_users', req.user.id).fetch();
  const invoice = await Invoice
    .getOrderDetail(req.params.id, store, InvoiceTransactionStatus.PROCEED);
  if (!invoice) throw getInvoiceError('invoice', 'not_found');
  req.resData = {
    message: 'Processing Order Detail Data',
    data: invoice,
  };
  return next();
};

PaymentController.getSales = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const storeId = await Store.getStoreId(req.user.id);
  const isJoin = req.query.is_dropship ? JSON.parse(req.query.is_dropship) : false;
  const invoices = await Invoice.getOrders(storeId, null, page, pageSize, isJoin);
  req.resData = {
    message: 'Sales Data',
    meta: { page, limit: pageSize },
    data: invoices,
  };
  return next();
};

PaymentController.getSaleDetail = async (req, res, next) => {
  const store = await Store.where('id_users', req.user.id).fetch();
  if (!store) throw getStoreError('store', 'not_found');
  const invoice = await Invoice.getOrderDetail(req.params.id, store);
  if (!invoice) throw getInvoiceError('invoice', 'not_found');
  req.resData = {
    message: 'Sale Detail Data',
    data: invoice,
  };
  return next();
};

PaymentController.acceptOrder = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const invoice = await Invoice.where({
    id_invoice: req.params.id,
    status_transaksi: InvoiceTransactionStatus.WAITING,
    id_toko: storeId,
  }).fetch({ withRelated: 'user' });
  if (!invoice) throw acceptOrderError('order', 'not_found');
  await Invoice.updateStatus(req.params.id, InvoiceTransactionStatus.PROCEED)
    .catch();
  const buyer = invoice.related('user');
  if (buyer.get('reg_token')) {
    Notification.send(
      buyerNotification.ORDER_PROCEED,
      buyer.get('reg_token'),
      req.marketplace,
      {
        bucket_id: String(invoice.get('id_bucket')),
        invoice_id: String(invoice.id),
        click_action: `transaction/${invoice.get('id_bucket')}/${invoice.id}`,
      },
    );
  }
  return next();
};

PaymentController.rejectOrder = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const invoice = await Invoice.where({
    id_invoice: req.params.id,
    status_transaksi: InvoiceTransactionStatus.WAITING,
    id_toko: storeId,
  }).fetch({ withRelated: 'user' });
  if (!invoice) throw rejectOrderError('order', 'not_found');
  await Invoice.updateStatus(req.params.id, InvoiceTransactionStatus.REJECTED)
    .catch();
  const buyer = invoice.related('user');
  if (buyer.get('reg_token')) {
    Notification.send(
      buyerNotification.ORDER_REJECTED,
      buyer.get('reg_token'),
      req.marketplace,
      {
        bucket_id: String(invoice.get('id_bucket')),
        invoice_id: String(invoice.id),
        click_action: `transaction/${invoice.get('id_bucket')}/${invoice.id}`,
      },
    );
  }
  return next();
};

PaymentController.inputAirwayBill = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const invoice = await Invoice.where({
    id_invoice: req.params.id,
    id_toko: storeId,
  }).query(qb => qb.whereIn('status_transaksi', [
    InvoiceTransactionStatus.PROCEED,
    InvoiceTransactionStatus.SENDING,
  ])).fetch({ withRelated: 'user' });
  if (!invoice) throw inputBillError('order', 'not_found');
  await Shipping.where('id_pengiriman_produk', invoice.get('id_pengiriman_produk'))
    .save({ resiresponkirim: req.body.airway_bill }, { require: true, patch: true })
    .catch(() => { throw inputBillError('input', 'error'); });
  await Invoice.updateStatus(req.params.id, InvoiceTransactionStatus.SENDING);
  const buyer = invoice.related('user');
  if (buyer.get('reg_token')) {
    Notification.send(
      buyerNotification.ORDER_SENT,
      buyer.get('reg_token'),
      req.marketplace,
      {
        bucket_id: String(invoice.get('id_bucket')),
        invoice_id: String(invoice.id),
        click_action: `transaction/${invoice.get('id_bucket')}/${invoice.id}`,
      },
    );
  }
  return next();
};
