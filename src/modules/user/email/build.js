import pug from 'pug';
import path from 'path';
import { email } from '../../core';

export const UserEmail = {};
export default { UserEmail };

UserEmail.buildEmail = ({ layout, subject, baseUrl, link, emailToSend, token }) => {
  const emailTemplate = pug.compileFile(path.join(__dirname, `./view/${layout}`));
  const url = `https://${baseUrl}/${link}?token=${token}`;
  const html = emailTemplate({ url });
  return email.build({ subject, emailToSend, html });
};

UserEmail.buildForgotPassword = (emailToSend, token, baseUrl) => UserEmail.buildEmail({
  layout: 'forgot_password.pug',
  subject: 'Reset Password Link',
  link: 'password/new',
  emailToSend,
  token,
  baseUrl,
});

UserEmail.buildActivateAccount = (emailToSend, token, baseUrl) => UserEmail.buildEmail({
  layout: 'activate_account.pug',
  subject: 'Activate Account Link',
  link: 'signup/verification',
  emailToSend,
  token,
  baseUrl,
});

UserEmail.sendForgotPassword = (emailToSend, token, baseUrl) => {
  email.send(UserEmail.buildForgotPassword(emailToSend, token, baseUrl));
};

UserEmail.sendActivateAccount = (emailToSend, token, baseUrl) => {
  email.send(UserEmail.buildActivateAccount(emailToSend, token, baseUrl));
};
