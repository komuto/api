import { BankAccount } from '../bank/model';
import { OTPStatus } from '../OTP/model';
import { Withdraw, Topup, TransSummary, TransType, SummTransType } from './model';
import { User } from '../user/model';
import { withdrawError, transDetailError } from './messages';
import nominal from '../../../config/nominal.json';

export const SaldoController = {};
export default { SaldoController };

SaldoController.withdrawWallet = async (req, res, next) => {
  const getType = TransType.where('kode_tipetransaksi', SummTransType.WITHDRAW).fetch();
  const { amount, bank_account_id } = req.body;
  const { id, saldo_wallet: saldo } = req.user;
  if (amount > saldo) throw withdrawError('amount', 'not_enough');
  const bankAccount = await BankAccount.getBankAccount(bank_account_id, id);
  if (!bankAccount) throw withdrawError('bank_account', 'bank_account_not_found');
  const remainingSaldo = saldo - amount;
  const createWithdraw = Withdraw.create(Withdraw.matchDBColumn({
    amount,
    bank_account_id,
    user_id: id,
  }));
  const type = await getType;
  const createSummary = TransSummary.create(TransSummary.matchDBColumn({
    amount,
    first_saldo: saldo,
    last_saldo: remainingSaldo,
    user_id: id,
    type: SummTransType.WITHDRAW,
    remark: type.get('nama_tipetransaksi'),
  }));
  const updateSaldo = User.where({ id_users: id })
    .save({ saldo_wallet: remainingSaldo }, { patch: true });
  const changeOTPStatus = req.otp.save({ status: OTPStatus.USED }, { patch: true })
    .catch(() => { throw new Error('otp'); });
  await Promise.all([createWithdraw, createSummary, updateSaldo, changeOTPStatus])
    .catch((e) => {
      // If unable to update otp status then swallow the error
      if (e.message !== 'otp') throw withdrawError('withdraw', 'title');
    });
  return next();
};

SaldoController.history = async (req, res, next) => {
  const transactions = await TransSummary.get(req.user.id);
  req.resData = {
    message: 'History Saldo',
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
  const transaction = await TransSummary.where({ id_summarytransaksi: req.params.id,
    id_users: req.user.id }).fetch();
  if (!transaction) throw transDetailError('transaction', 'not_found');
  req.body.transType = transaction.get('kode_summarytransaksi');
  req.body.transaction = transaction;
  return next();
};

// SaldoController.sellingTrans = async (req, res, next) => {
//   if (req.body.transType !== SummTransType.SELLING) return next();
//
// }

// SaldoController.paymentTrans = async (req, res, next) => {
//   if (req.body.transType !== SummTransType.PAYMENT) return next();
//
// }

SaldoController.withdrawTrans = async (req, res, next) => {
  if (req.body.transType !== SummTransType.WITHDRAW) return next();
  const transaction = await req.body.transaction.load('summaryable.bankAccount.bank');
  const bankAccount = transaction.related('summaryable').related('bankAccount').serialize({ minimal: true });
  bankAccount.bank = bankAccount.bank.serialize({ minimal: true });
  bankAccount.bankId = undefined;
  const data = { transaction: transaction.serialize({ minimal: true }), bankAccount };
  req.resData = { message: 'Withdraw Transaction Data', data };
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
