import { utils } from '../core';
import { Bank, BankAccount, BankAccountStatus } from './model';
import { createMsg, updateMsg, getAccountMsg, deleteMsg } from './message';
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

BankController.getBankAccount = async (req, res, next) => {
  const bankAccount = await BankAccount.where({ id_rekeninguser: req.params.id,
    id_users: req.user.id }).fetch({ withRelated: 'bank' });
  if (!bankAccount) throw new BadRequestError(getAccountMsg.title, formatSingularErr('account', getAccountMsg.not_found));
  req.resData = {
    message: 'Bank Account Data',
    data: bankAccount,
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

BankController.updateBankAccount = async (req, res, next) => {
  // Check rekening id
  const bankAccount = await BankAccount.where({ id_rekeninguser: req.params.id,
    id_users: req.user.id }).fetch();
  if (!bankAccount) throw new BadRequestError(updateMsg.title, formatSingularErr('account', updateMsg.not_found));
  // Check whether no rekening is already used or not
  const check = await BankAccount.query((qb) => {
    qb.where({ id_users: req.user.id, nomor_rekening: req.body.holder_account_number });
    qb.whereNot({ id_rekeninguser: req.params.id });
  }).fetch();
  if (check) throw new BadRequestError(updateMsg.title, formatSingularErr('holder_account_number', createMsg.duplicate_account));

  await bankAccount.save(BankAccount.matchDBColumn(req.body), { patch: true });
  await bankAccount.load('bank');
  req.resData = {
    message: 'Bank Account Data',
    data: bankAccount,
  };
  return next();
};

BankController.deleteBankAccount = async (req, res, next) => {
  await BankAccount.where({ id_rekeninguser: req.params.id, id_users: req.user.id })
    .destroy({ require: true })
    .catch(() => next(new BadRequestError(deleteMsg.title, formatSingularErr('account', deleteMsg.not_found))));
  return next();
};
