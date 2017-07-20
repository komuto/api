import pug from 'pug';
import path from 'path';
import { email } from '../../core';

export const OTPEmail = {};
export default { OTPEmail };

OTPEmail.buildEmail = ({ layout, subject, data }) => {
  const emailTemplate = pug.compileFile(path.join(__dirname, `./view/${layout}`));
  const html = emailTemplate({ data });
  return email.build({ subject, emailToSend: data.email, html });
};

OTPEmail.buildOTPMail = data => OTPEmail.buildEmail({
  layout: 'otp.pug',
  subject: 'OTP Komuto',
  data,
});

OTPEmail.send = (data) => {
  email.send(OTPEmail.buildOTPMail(data));
};
