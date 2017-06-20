import sendgrid from 'sendgrid';
import config from '../../../config';

const { mail: helper } = sendgrid;

export const UserEmail = {};
export default { UserEmail };

/**
 * Build forgot password email to send
 * @param {string} email
 * @return {json} mail
 */
UserEmail.buildForgotPassword = (email) => {
  const fromEmail = new helper.Email(config.emailFrom);
  const toEmail = new helper.Email(email);
  const subject = 'Reset Password Link';
  const content = new helper.Content('text/html', 'Click the link below to reset your password:<br />' +
  `${config.frontendKomuto}forgot_password`);
  const mail = new helper.Mail(fromEmail, subject, toEmail, content);
  return mail.toJSON();
};

/**
 * Build activation email to send
 * @param {string} email
 * @param {string} token
 * @return {json} mail
 */
UserEmail.buildActivation = (email, token) => {
  const fromEmail = new helper.Email(config.emailFrom);
  const toEmail = new helper.Email(email);
  const subject = 'Activate Account Link';
  const content = new helper.Content('text/html', 'Click the link below to activate your account:<br />' +
    `${config.frontendKomuto}/signup-verification?token=${token}`);
  const mail = new helper.Mail(fromEmail, subject, toEmail, content);
  return mail.toJSON();
};

/**
 * @param {function} buildEmail
 */
UserEmail.send = (toSend) => {
  const sg = sendgrid(config.emailKey);
  const request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: toSend,
  });
  sg.API(request);
};
