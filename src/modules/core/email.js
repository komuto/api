import mandrill from 'mandrill-api';
import config from '../../../config';

export const email = {};
export default { email };

/**
 * Build email to send
 */
email.build = ({ subject, emailParams, html }) => ({
  html,
  subject,
  from_email: emailParams.from,
  from_name: emailParams.fromName,
  to: [
    {
      email: emailParams.to,
      name: emailParams.toName,
      type: 'to',
    },
  ],
});

email.send = (message) => {
  const mandrillClient = new mandrill.Mandrill(config.emailApiKey);

  mandrillClient.messages.send({
    message,
    async: false,
    ip_pool: 'Main Pool',
    send_at: new Date(),
  });
};
