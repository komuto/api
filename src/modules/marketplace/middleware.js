import Cryptorjs from 'cryptorjs';
import { Marketplace } from './model';
import { NotFoundError } from '../../../common/errors';
import config from '../../../config';
import messages from '../core/messages';

const crypt = new Cryptorjs(config.secretKey);

export function verify() {
  return async (req, res, next) => {
    try {
      const decoded = crypt.decode(req.params.mp);
      const marketplace = await Marketplace.findById(decoded.id);
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
