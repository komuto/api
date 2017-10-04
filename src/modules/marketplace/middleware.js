import Cryptorjs from 'cryptorjs';
import { Marketplace } from './model';
import { BadRequestError } from '../../../common/errors';
import config from '../../../config';

const crypt = new Cryptorjs(config.secretKey);

export function verify() {
  return async (req, res, next) => {
    try {
      const decoded = crypt.decode(req.params.mp);
      const marketplace = await Marketplace.findById(decoded.id);
      if (!marketplace) next(new BadRequestError('Marketplace Not Found'));
      req.marketplace = marketplace.serialize();
      next();
    } catch (e) {
      const msg = e.code === 'ECONNREFUSED' ? 'Database down' : 'Path Not Found';
      const err = new Error(msg);
      err.httpStatus = e.code === 'ECONNREFUSED' ? 500 : 404;
      next(err);
    }
  };
}
export default { verify };
