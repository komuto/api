import doku from 'doku_library';
import sha1 from 'sha1';
import { PaymentMethod, Invoice } from './model';

const helper = doku.helper();
const library = doku.library();
const config = doku.config();
const api = doku.api();

export const PaymentController = {};
export default { PaymentController };

PaymentController.getMethods = async (req, res, next) => {
  req.resData = {
    message: 'Payment Methods Data',
    data: await PaymentMethod.getAll(),
  };
  return next();
};

PaymentController.choosePaymentMethod = async (req, res, next) => {
  const invoice = await Invoice.getById(req.body.invoice_id, req.user.id);
  await Invoice.updatePaymentMethod(invoice, req.body.payment_method_id);
  return next();
};

PaymentController.store = async (req, res, next) => {
  // const sessionId = helper.sha1(helper.getTimes14Character());
  const shareKey = '3iVKd220tSAz';
  // const generateWords = library.doCreateWords(req, req.body.MALLID, shareKey);
  // const basket = {
  //   name: 'Powerbank Xiaomi',
  //   amount: '300000.00',
  //   quantity: '1',
  //   subtotal: '300000.00',
  // };
  //
  // const dataPayment = {
  //   req_mall_id: req.body.MALLID,
  //   req_chain_merchant: 'NA',
  //   req_amount: '10000.00',
  //   req_words: generateWords,
  //   req_purchase_amount: '10000.00',
  //   req_trans_id_merchant: req.body.INVOICE,
  //   req_request_date_time: helper.getTimes14Character(),
  //   req_currency: '360',
  //   req_purchase_currency: '360',
  //   req_session_id: sessionId,
  //   req_name: 'Satrio Wisnugroho',
  //   req_payment_channel: 15,
  //   req_basket: req.body.BASKET,
  //   req_email: 'wisnu@skyshi.com',
  //   req_token_id: 'asd',
  // };

  // {
  //   "MALLID": "4533",
  //   "CHAINMERCHANT": "NA",
  //   "AMOUNT": "100000",
  //   "PURCHASEAMOUNT": "100000",
  //   "TRANSIDMERCHANT": "sndbox_mcQMAKGaW3",
  //   "WORDS": "96f87a76cbb0aad31aa5305994427e941200d761",
  //   "REQUESTDATETIME": "20141010000000",
  //   "CURRENCY": "360",
  //   "PURCHASECURRENCY": "360",
  //   "SESSIONID": "234asdf234",
  //   "NAME": "Satrio Wisnugroho",
  //   "EMAIL": "wisnu@skyshi.com",
  //   "BASKET": "Kaset Dangdut,100000.00,1,100000.00;Service Charge,7500.00,1,7500.00;",
  //   "SHIPPING_ADDRESS": "Jln Tampomas",
  //   "SHIPPING_CITY": "SLEMAN",
  //   "SHIPPING_STATE": "DI Yogyakarta",
  //   "SHIPPING_COUNTRY": "GAMPING",
  //   "SHIPPING_ZIPCODE": "55291",
  // }

  // {
  //   "MALLID": 4453,
  //   "AMOUNT": "10000.00",
  //   "INVOICE": "invoice_00001",
  //   "CURRENCY": "360",
  //   "PAIRINGCODE": "asd",
  //   "TOKEN": "asd"
  // }

  // api.doPrePayment(dataPayment, (response) => {
  //   const obj = JSON.parse(JSON.stringify(response));
  //   if (obj.res_response_msg === 'SUCCESS' && obj.res_response_code === '0000') {
  //     // SUCCESS RESPONSE
  //   } else {
  //     // FAILED RESPONSE
  //   }
  //   console.log(obj);
  // });
  //
  // console.log(sessionId, shareKey, generateWords);

  // const words = sha1(req.body.AMOUNT + req.body.MALLID + shareKey + req.body.INVOICE);
  // req.resData = { data: words };

  api.doPrePayment({ req_basket: library.formatBasket('testing item,10000.00,1,10000.00') }, (response) => {
    const obj = JSON.parse(JSON.stringify(response));
    if (obj.res_response_msg === 'SUCCESS' && obj.res_response_code === '0000') {
      // SUCCESS RESPONSE
    } else {
      // FAILED RESPONSE
    }
    console.log(obj);
  });

  return next();
};
