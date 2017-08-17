import { BankAccount } from '../bank/model';
import { OTPStatus } from '../OTP/model';
import { Withdraw, TransSummary, TransType } from './model';
import { User } from '../user/model';
import { withdrawError } from './messages';

export const SaldoController = {};
export default { SaldoController };

SaldoController.withdrawWallet = async (req, res, next) => {
  const { amount, bank_account_id } = req.body;
  const { id, saldo_wallet: saldo } = req.user;
  if (amount > saldo) throw withdrawError('amount', 'not_enough');
  const bankAccount = await BankAccount.getBankAccount(bank_account_id, id);
  if (!bankAccount) throw withdrawError('bank_account', 'bank_account_not_found');
  const remainingSaldo = saldo - amount;
  const createWithdraw = Withdraw.create(Withdraw.matchDBColumn({
    amount,
    bank_account_id,
    user_id: id }));
  const createSummary = TransSummary.create(TransSummary.matchDBColumn({
    amount,
    first_saldo: saldo,
    last_saldo: remainingSaldo,
    user_id: id }), TransType.WITHDRAW);
  const updateSaldo = User.where({ id_users: id })
    .save({ saldo_wallet: remainingSaldo }, { patch: true });
  const changeOTPStatus = req.otp.save({ status: OTPStatus.USED }, { patch: true })
    .catch(() => { throw new Error('otp'); });
  await Promise.all([createWithdraw, createSummary, updateSaldo, changeOTPStatus])
    .catch((e) => {
      // If unable to update otp status then swallow the error
      if (e.message !== 'otp') throw withdrawError('withdraw', 'title');
    });
  // TODO: Ask when one of the insert or update saldo fails then what to do?
  return next();
};

