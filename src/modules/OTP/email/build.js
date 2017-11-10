import pug from 'pug';
import path from 'path';
import { email } from '../../core';

export const OTPAddressEmail = {};
export default { OTPAddressEmail };

OTPAddressEmail.buildEmail = ({ layout, subject, emailParams, data }) => {
  const emailTemplate = pug.compileFile(path.join(__dirname, `./view/${layout}`));
  const html = emailTemplate({ data });
  return email.build({ subject, emailParams, html });
};

OTPAddressEmail.buildOtpAddressMail = (emailParams, data) => OTPAddressEmail.buildEmail({
  layout: 'otp_address.pug',
  subject: 'OTP Address',
  emailParams,
  data,
});

OTPAddressEmail.sendOtpAddress = (emailParams, data) => {
  email.send(OTPAddressEmail.buildOtpAddressMail(emailParams, data));
};
