import moment from 'moment';
import _ from 'lodash';
import { createOTPError, createBankError, verifyOTPError } from './messages';
import { OTP, OTPStatus, OTPHP, OTPHPStatus } from './model';

export const OTPController = {};
export default { OTPController };

OTPController.createOTPHP = async (req, res, next) => {
  if (!req.user.phone_number) throw createOTPError('phone_number', 'phone_not_available');
  const data = { id_users: req.user.id, status_otphp: OTPHPStatus.CREATED };
  req.otp = await OTPHP.checkOTP(data) || new OTPHP();
  if (_.isEmpty(req.otp.attributes)) req.otp = await req.otp.create(data);
  return next();
};

/**
 * For OTP bank
 */
OTPController.createOTPBank = async (req, res, next) => {
  if (!req.user.phone_number) throw createBankError('phone_number', 'phone_not_verified');
  const data = { id_users: req.user.id, status: OTPStatus.DRAFT, no_hp: req.user.phone_number };
  req.otp = await OTP.checkOTP(data) || new OTP();
  if (_.isEmpty(req.otp.attributes)) req.otp = await req.otp.create(data);
  return next();
};

OTPController.sendSms = async (req, res, next) => {
  const otp = req.otp;
  await otp.sendSms();
  return next();
};

/**
 * Verify OTP code
 */
OTPController.verifyOTPHPCode = async (req, res, next) => {
  const data = {
    id_users: req.user.id,
    kode_otphp: req.body.code,
    status_otphp: OTPHPStatus.CREATED,
  };
  const otp = await OTPHP.query(qb => qb.where(data).andWhere('expdate_otphp', '>', moment())).fetch();
  if (!otp) throw verifyOTPError('code', 'not_found');
  await otp.save({ status_otphp: OTPHPStatus.VERIFIED }, { patch: true });
  return next();
};

OTPController.verifyOTPBankCode = error => async (req, res, next) => {
  const data = { id_users: req.user.id, kode: req.body.code };
  const status = OTPStatus.USED;
  const otp = await OTP.query(qb => qb.where(data).andWhereNot({ status }).andWhere('date_expired', '>', moment())).fetch();
  if (!otp) throw error;
  req.otp = otp;
  return next();
};

OTPController.deleteOTPHP = async (req, res, next) => {
  await OTPHP.where({ id_users: req.user.id }).destroy();
  return next();
};

