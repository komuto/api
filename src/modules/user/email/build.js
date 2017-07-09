import pug from 'pug';
import path from 'path';
import { email } from '../../core';
import config from '../../../../config';

export const UserEmail = {};
export default { UserEmail };

UserEmail.buildEmail = ({ layout, subject, link, emailToSend, token }) => {
  const emailTemplate = pug.compileFile(path.join(__dirname, `./view/${layout}`));
  const url = `${config.frontendKomuto}/${link}?token=${token}`;
  const html = emailTemplate({ url });
  return email.build({ subject, emailToSend, html });
};

UserEmail.buildForgotPassword = (emailToSend, token) => UserEmail.buildEmail({
  layout: 'forgot_password.pug',
  subject: 'Reset Password Link',
  link: 'password-new',
  emailToSend,
  token,
});

UserEmail.buildActivateAccount = (emailToSend, token) => UserEmail.buildEmail({
  layout: 'activate_account.pug',
  subject: 'Activate Account Link',
  link: 'signup-verification',
  emailToSend,
  token,
});

UserEmail.sendForgotPassword = (emailToSend, token) => {
  email.send(UserEmail.buildForgotPassword(emailToSend, token));
};

UserEmail.sendActivateAccount = (emailToSend, token) => {
  email.send(UserEmail.buildActivateAccount(emailToSend, token));
};
