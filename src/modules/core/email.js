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
  console.log(message);
  const mandrillClient = new mandrill.Mandrill(config.emailApiKey);
  message = {
    "html": "<p>Example HTML content</p>",
    "text": "Example text content",
    "subject": "example subject",
    "from_email": "message.from_email@example.com",
    "from_name": "Example Name",
    "to": [{
      "email": "wwisnuu@gmail.com",
      "name": "Recipient Name",
      "type": "to"
    }],
    "headers": {
      "Reply-To": "message.reply@example.com"
    },
    "important": false,
    "track_opens": null,
    "track_clicks": null,
    "auto_text": null,
    "auto_html": null,
    "inline_css": null,
    "url_strip_qs": null,
    "preserve_recipients": null,
    "view_content_link": null,
    "bcc_address": "message.bcc_address@example.com",
    "tracking_domain": null,
    "signing_domain": null,
    "return_path_domain": null,
    "merge": true,
    "merge_language": "mailchimp",
    "global_merge_vars": [{
      "name": "merge1",
      "content": "merge1 content"
    }],
    "merge_vars": [{
      "rcpt": "recipient.email@example.com",
      "vars": [{
        "name": "merge2",
        "content": "merge2 content"
      }]
    }],
    "tags": [
      "password-resets"
    ],
    "subaccount": "customer-123",
    "google_analytics_domains": [
      "example.com"
    ],
    "google_analytics_campaign": "message.from_email@example.com",
    "metadata": {
      "website": "www.example.com"
    },
    "recipient_metadata": [{
      "rcpt": "recipient.email@example.com",
      "values": {
        "user_id": 123456
      }
    }],
    "attachments": [{
      "type": "text/plain",
      "name": "myfile.txt",
      "content": "ZXhhbXBsZSBmaWxl"
    }],
    "images": [{
      "type": "image/png",
      "name": "IMAGECID",
      "content": "ZXhhbXBsZSBmaWxl"
    }]
  };

  mandrillClient.messages.send({
    message,
    async: false,
    ip_pool: 'Main Pool',
    send_at: new Date(),
  }, (result) => {
    console.log(result);
  }, (e) => {
    console.log('Error', e);
  });
};
