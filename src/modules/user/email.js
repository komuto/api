import sendgrid from 'sendgrid';
import config from '../../../config';

const { mail: helper } = sendgrid;

export const UserEmail = {};
export default { UserEmail };

UserEmail.buildForgotPassword = (email) => {
  const fromEmail = new helper.Email(config.emailFrom);
  const toEmail = new helper.Email(email);
  const subject = 'Reset Password Link';
  const content = new helper.Content('text/html', 'Click the link below to reset your password:<br />' +
  `${config.frontendKomuto}forgot_password`);
  const mail = new helper.Mail(fromEmail, subject, toEmail, content);
  return mail.toJSON();
};

UserEmail.send = (toSend) => {
  const sg = sendgrid(config.emailKey);
  const request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: toSend,
  });
  sg.API(request);
};
