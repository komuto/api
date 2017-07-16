import { errMsg } from './error';

const { createMsg, deleteMsg } = errMsg;
const constraints = {};

constraints.createUpdate = {
  code: {
    presence: { message: createMsg.code_presence },
    numericality: {
      greaterThanOrEqualTo: 10000,
      lessThanOrEqualTo: 99999,
      message: createMsg.code_not_valid } },
  master_bank_id: { presence: { message: createMsg.master_bank_presence } },
  holder_name: { presence: { message: createMsg.holder_name_presence } },
  holder_account_number: {
    presence: { message: createMsg.account_number_presence },
    format: { pattern: /^[0-9]+$/, message: createMsg.account_number_not_valid } },
  bank_branch_office_name: { presence: { message: createMsg.bank_brach_name_presence } },
};

constraints.delete = {
  code: {
    presence: { message: deleteMsg.code_presence },
    numericality: {
      greaterThanOrEqualTo: 10000,
      lessThanOrEqualTo: 99999,
      message: deleteMsg.code_not_valid,
    },
  },
};

export default constraints;
