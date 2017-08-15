import pug from 'pug';
import path from 'path';
import { email } from '../../core';

export const OTPAddressEmail = {};
export default { OTPAddressEmail };

OTPAddressEmail.buildEmail = ({ layout, subject, emailToSend, data }) => {
  const emailTemplate = pug.compileFile(path.join(__dirname, `./view/${layout}`));
  const html = emailTemplate({ data });
  return email.build({ subject, emailToSend, html });
};

OTPAddressEmail.buildOtpAddressMail = (emailToSend, data) => OTPAddressEmail.buildEmail({
  layout: 'otp_address.pug',
  subject: 'OTP Address',
  emailToSend,
  data,
});

OTPAddressEmail.sendOtpAddress = (emailToSend, data) => {
  email.send(OTPAddressEmail.buildOtpAddressMail(emailToSend, data));
};
