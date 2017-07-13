import { Bank, BankAccount } from './model';

export const BankController = {};
export default { BankController };

/**
 * Get all banks
 */
BankController.getAll = async (req, res, next) => {
  const banks = await Bank.getAll();
  req.resData = {
    status: true,
    message: 'Master Bank Data',
    data: banks,
  };
  return next();
};

BankController.getBank = async (req, res, next) => {
  const bank = await Bank.getById(req.params.id);
  req.resData = {
    status: true,
    message: 'Master Bank Data',
    data: bank,
  };
  return next();
};

BankController.getBankAccounts = async (req, res, next) => {
  const bankAccounts = await BankAccount.getByUserId(req.user.id);
  req.resData = {
    status: true,
    message: 'Bank Account Data',
    data: bankAccounts,
  };
  return next();
};
