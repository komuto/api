import { utils } from '../core';
import { Bank, BankAccount, BankAccountStatus } from './model';
import { createMsg } from './message';
import { BadRequestError } from '../../../common/errors';

const { formatSingularErr } = utils;

export const BankController = {};
export default { BankController };

/**
 * Get all banks
 */
BankController.getAll = async (req, res, next) => {
  const banks = await Bank.getAll();
  req.resData = {
    message: 'Master Bank Data',
    data: banks,
  };
  return next();
};

BankController.getBank = async (req, res, next) => {
  const bank = await Bank.getById(req.params.id);
  req.resData = {
    message: 'Master Bank Data',
    data: bank,
  };
  return next();
};

BankController.getBankAccounts = async (req, res, next) => {
  const bankAccounts = await BankAccount.getByUserId(req.user.id);
  req.resData = {
    message: 'Bank Account Data',
    data: bankAccounts,
  };
  return next();
};

BankController.createBankAccount = async (req, res, next) => {
  let bankAccount = await BankAccount.where({ id_users: req.user.id,
    nomor_rekening: req.body.holder_account_number }).fetch();
  if (bankAccount) throw new BadRequestError(createMsg.title, formatSingularErr('holder_account_number', createMsg.duplicate_account));
  req.body.is_primary = BankAccountStatus.NOT_PRIMARY;
  req.body.user_id = req.user.id;
  bankAccount = await new BankAccount(BankAccount.matchDBColumn(req.body)).save();
  await bankAccount.load('bank');

  req.resData = {
    message: 'Bank Account Data',
    data: bankAccount,
  };
  return next();
};
