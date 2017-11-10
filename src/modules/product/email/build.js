import pug from 'pug';
import path from 'path';
import { email } from '../../core';
import config from './../../../../config';
import { ReportTypeWord } from './../model';

export const ReportEmail = {};
export default { ReportEmail };

ReportEmail.buildEmail = ({ layout, subject, emailParams, report, product, baseUrl }) => {
  const emailTemplate = pug.compileFile(path.join(__dirname, `./view/${layout}`));
  product.link = `https://${baseUrl}/product-detail?id=${product.id}`;
  report.type_word = ReportTypeWord(report.type);
  const html = emailTemplate({ report, product });
  return email.build({ subject, emailParams, html });
};

ReportEmail.buildReportMail = (emailParams, report, product, baseUrl) => ReportEmail.buildEmail({
  layout: 'report_product.pug',
  subject: 'Report Product',
  emailParams,
  report,
  product,
  baseUrl,
});

ReportEmail.sendReportProduct = (emailParams, report, product, baseUrl) => {
  email.send(ReportEmail.buildReportMail(emailParams, report, product, baseUrl));
};
