import pug from 'pug';
import path from 'path';
import { email } from '../../core';
import config from './../../../../config';
import { ReportTypeWord } from './../model';

export const ReportEmail = {};
export default { ReportEmail };

ReportEmail.buildEmail = ({ layout, subject, emailToSend, report, product }) => {
  const emailTemplate = pug.compileFile(path.join(__dirname, `./view/${layout}`));
  product.link = `${config.frontendKomuto}/product-detail?id=${product.id}`;
  report.type_word = ReportTypeWord(report.type);
  const html = emailTemplate({ report, product });
  return email.build({ subject, emailToSend, html });
};

ReportEmail.buildReportMail = (emailToSend, report, product) => ReportEmail.buildEmail({
  layout: 'report_product.pug',
  subject: 'Report Product',
  emailToSend,
  report,
  product,
});

ReportEmail.sendReportProduct = (emailToSend, report, product) => {
  email.send(ReportEmail.buildReportMail(emailToSend, report, product));
};
