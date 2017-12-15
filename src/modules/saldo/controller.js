import { BankAccount } from '../bank/model';
import { OTPStatus } from '../OTP/model';
import { Withdraw, Topup, TransSummary, TransType, SummTransType, TopupStatus } from './model';
import { User } from '../user/model';
import { withdrawError, transDetailError } from './messages';
import nominal from '../../../config/nominal.json';

export const SaldoController = {};
export default { SaldoController };

SaldoController.withdrawWallet = async (req, res, next) => {
  const getRemark = TransType.getRemark(SummTransType.WITHDRAW);
  const { amount, bank_account_id } = req.body;
  const { id, saldo_wallet: saldo } = req.user;
  if (amount > saldo) throw withdrawError('amount', 'not_enough');
  const bankAccount = await BankAccount.getBankAccount(bank_account_id, id);
  if (!bankAccount) throw withdrawError('bank_account', 'bank_account_not_found');
  const remainingSaldo = saldo - amount;
  const withdraw = await Withdraw.create(Withdraw.matchDBColumn({
    amount,
    bank_account_id,
    user_id: id,
  }));
  const remark = await getRemark;
  const createSummary = TransSummary.create(TransSummary.matchDBColumn({
    amount,
    first_saldo: saldo,
    last_saldo: remainingSaldo,
    user_id: id,
    type: SummTransType.WITHDRAW,
    remark,
    summaryable_type: 'withdraw_wallet',
    summaryable_id: withdraw.get('id'),
  }));
  const updateSaldo = User.where({ id_users: id })
    .save({ saldo_wallet: remainingSaldo }, { patch: true });
  const changeOTPStatus = req.otp.save({ status: OTPStatus.USED }, { patch: true })
    .catch(() => {
      throw new Error('otp');
    });
  await Promise.all([createSummary, updateSaldo, changeOTPStatus])
    .catch((e) => {
      // If unable to update otp status then swallow the error
      if (e.message !== 'otp') throw withdrawError('withdraw', 'title');
    });
  return next();
};

SaldoController.history = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  let filters = req.query.filter;
  if (filters) {
    filters = filters.split(',').reduce((result, type) => {
      switch (type) {
        case 'commission':
          result.push(SummTransType.FEE);
          break;
        case 'sale':
          result.push(SummTransType.SELLING);
          break;
        case 'refund':
          result.push(SummTransType.REFUND);
          break;
        case 'topup':
          result.push(SummTransType.TOPUP);
          break;
        case 'buy':
          result.push(SummTransType.PAYMENT);
          break;
        case 'withdraw':
          result.push(SummTransType.WITHDRAW);
          break;
        default:
          break;
      }
      return result;
    }, []);
  }

  const transactions = await TransSummary.get(
    req.user.id, {
      filters,
      start_at: req.query.start_at,
      end_at: req.query.end_at,
    },
    page,
    pageSize,
  );
  req.resData = {
    message: 'History Saldo',
    meta: { page, limit: pageSize },
    data: transactions,
  };
  return next();
};

SaldoController.nominal = async (req, res, next) => {
  req.resData = {
    message: 'Nominal Saldo Data',
    data: nominal,
  };
  return next();
};

SaldoController.historyDetail = async (req, res, next) => {
  const transaction = await TransSummary.where({
    id_summarytransaksi: req.params.id,
    id_users: req.user.id,
  }).fetch();
  if (!transaction) throw transDetailError('transaction', 'not_found');
  req.body.transType = transaction.get('kode_summarytransaksi');
  req.body.transaction = transaction;
  return next();
};

SaldoController.sellingTrans = async (req, res, next) => {
  const type = req.body.transType;
  if (type !== SummTransType.SELLING && type !== SummTransType.FEE) return next();
  const data = await req.body.transaction.getSellingDetail(type, req.marketplace.mobile_domain)
    .catch(() => { throw transDetailError('transaction', 'transaction_corrupted'); });
  const message = type === SummTransType.SELLING ? 'Selling Transaction Data' : 'Commission Transaction Data';
  req.resData = { message, data };
  return next();
};

SaldoController.paymentTrans = async (req, res, next) => {
  if (req.body.transType !== SummTransType.PAYMENT) return next();
  const data = await req.body.transaction.getPaymentDetail(req.marketplace.mobile_domain)
    .catch(() => { throw transDetailError('transaction', 'transaction_corrupted'); });
  req.resData = { message: 'Payment Transaction Data', data };
  return next();
};

SaldoController.topupTrans = async (req, res, next) => {
  if (req.body.transType !== SummTransType.TOPUP) return next();
  const transaction = await req.body.transaction.load([
    { summaryable: qb => qb.where({ status: TopupStatus.SUCCESS }) },
    'summaryable.paymentMethod',
  ]);
  let method;
  try {
    method = transaction.related('summaryable').related('paymentMethod').get('nama_paymentmethod') || null;
  } catch (e) {
    throw transDetailError('transaction', 'transaction_corrupted');
  }
  const data = { ...transaction.serialize(), payment_method: method };
  req.resData = { message: 'Topup Transaction Data', data };
  return next();
};

SaldoController.withdrawTrans = async (req, res, next) => {
  if (req.body.transType !== SummTransType.WITHDRAW) return next();
  const transaction = await req.body.transaction.load('summaryable.bankAccount.bank');
  let bankAccount;
  try {
    bankAccount = transaction.related('summaryable').related('bankAccount').serialize({ minimal: true });
  } catch (e) {
    throw transDetailError('transaction', 'transaction_corrupted');
  }
  bankAccount.bank = bankAccount.bank.serialize({ minimal: true });
  bankAccount.bankId = undefined;
  const data = { transaction: transaction.serialize(), bankAccount };
  req.resData = { message: 'Withdraw Transaction Data', data };
  return next();
};

SaldoController.refundTrans = async (req, res, next) => {
  if (req.body.transType !== SummTransType.REFUND) return next();

  let data;
  if (req.body.transaction.get('summaryable_type') === 'bucket_refund') {
    const transaction = await req.body.transaction.load({ 'summaryable.items.image': qb => qb.orderBy('id_gambarproduk') });
    let refund;
    let items;
    try {
      refund = transaction.related('summaryable');
      items = refund.related('items').map(item => item.serialize({ minimal: true }));
    } catch (e) {
      throw transDetailError('transaction', 'transaction_corrupted');
    }
    data = {
      transaction: transaction.serialize(),
      refund: { ...refund.serialize({ minimal: true }), items },
    };
  } else {
    data = await req.body.transaction.getSellingDetail(
      SummTransType.SELLING,
      req.marketplace.mobile_domain,
    ).catch(() => {
      throw transDetailError('transaction', 'transaction_corrupted');
    });
  }

  req.resData = { message: 'Refund Transaction Data', data };

  return next();
};

SaldoController.endTrans = (req, res, next) => {
  if (!req.resData) {
    throw transDetailError('transaction', 'not_found');
  }
  return next();
};

SaldoController.getTopupStatus = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const topup = await Topup.get(req.user.id, page, pageSize);
  req.resData = {
    message: 'Topup Data',
    meta: { page, limit: pageSize },
    data: topup,
  };
  return next();
};

SaldoController.getWithdrawStatus = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const withdraw = await Withdraw.get(req.user.id, page, pageSize);
  req.resData = {
    message: 'Withdraw Data',
    meta: { page, limit: pageSize },
    data: withdraw,
  };
  return next();
};
