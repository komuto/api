import { Marketplace } from './model';
import { NotFoundError } from '../../../common/errors';
import messages from '../core/messages';
import config from '../../../config';

export function verify() {
  return async (req, res, next) => {
    try {
      const host = req.get('host').includes(':') ? config.defaultApiDomain : req.get('host');
      const marketplace = await Marketplace.findByDomain(host);
      if (!marketplace) next(new NotFoundError(messages.marketplace_not_found.msg));
      req.marketplace = marketplace.serialize();
      next();
    } catch (e) {
      const msg = e.code === 'ECONNREFUSED' ? messages.database_down.msg : messages.path_not_found.msg;
      const err = new Error(msg);
      err.httpStatus = e.code === 'ECONNREFUSED' ? messages.database_down.code : messages.path_not_found.code;
      next(err);
    }
  };
}
export default { verify };
