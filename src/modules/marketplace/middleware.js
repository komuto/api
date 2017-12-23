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
      let msg;
      let statusCode;
      switch (e.code) {
        case 'ECONNREFUSED':
          msg = messages.database_down.msg;
          statusCode = messages.database_down.code;
          break;
        case 'ENETUNREACH':
          msg = messages.database_reached.msg;
          statusCode = messages.database_reached.code;
          break;
        default:
          msg = messages.path_not_found.msg;
          statusCode = messages.path_not_found.code;
          break;
      }

      const err = new Error(msg);
      err.httpStatus = statusCode;
      next(err);
    }
  };
}
export default { verify };
