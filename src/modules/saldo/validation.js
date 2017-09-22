import { errMsg } from './messages';

const { withdrawMsg } = errMsg;
const constraints = {};

constraints.withdraw = {
  bank_account_id: {
    presence: withdrawMsg.bank_account_presence,
    numericality: { onlyInteger: true, message: withdrawMsg.not_number },
  },
  amount: {
    presence: withdrawMsg.amount_presence,
    numericality: { onlyInteger: true, message: withdrawMsg.not_number },
  },
  code: {
    presence: { message: withdrawMsg.otp_presence },
    numericality: {
      greaterThanOrEqualTo: 10000,
      lessThanOrEqualTo: 99999,
      message: withdrawMsg.otp_not_valid,
    },
  },
};

constraints.history = {
  filter: {
    presence: false,
    format: {
      pattern: /^((commission|sale|refund|topup|buy|withdraw)+,)*(commission|sale|refund|topup|buy|withdraw)+$/,
      message: 'accept only `commission`, `sale`, `refund`, `topup`, `buy`, and `withdraw` value. Separated by comma',
    },
  },
  start_at: { presence: false },
  end_at: { presence: false },
};

export default constraints;
