import sendgrid from 'sendgrid';
import config from '../../../config';

const { mail: helper } = sendgrid;

export const email = {};
export default { email };

/**
 * Build email to send
 * @param {string} subject
 * @param {string} emailToSend
 * @param {string} html
 */
email.build = ({ subject, emailToSend, html }) => {
  const fromEmail = new helper.Email(config.emailFrom);
  const toEmail = new helper.Email(emailToSend);
  const content = new helper.Content('text/html', html);
  const mail = new helper.Mail(fromEmail, subject, toEmail, content);
  return mail.toJSON();
};

/**
 * @param toSend {function} buildEmail
 */
email.send = (toSend) => {
  const sg = sendgrid(config.emailKey);
  const request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: toSend,
  });
  sg.API(request);
};
