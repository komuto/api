import { OTPMsg, masterBankMsg, holderNameMsg, holderAccountMsg, bankBranchMsg } from './message';

const constraints = {};

constraints.create = {
  code: {
    presence: { message: OTPMsg.presence },
    numericality: {
      greaterThanOrEqualTo: 10000,
      lessThanOrEqualTo: 99999,
      message: OTPMsg.not_valid } },
  master_bank_id: { presence: { message: masterBankMsg.presence } },
  holder_name: { presence: { message: holderNameMsg.presence } },
  holder_account_number: {
    presence: { message: holderAccountMsg.presence },
    format: { pattern: /^[0-9]+$/, message: holderAccountMsg.not_valid } },
  bank_branch_office_name: { presence: { message: bankBranchMsg.presence } },
};

constraints.delete = {
  code: {
    presence: { message: OTPMsg.presence },
    numericality: {
      greaterThanOrEqualTo: 10000,
      lessThanOrEqualTo: 99999,
      message: OTPMsg.not_valid,
    },
  },
};

export default constraints;
