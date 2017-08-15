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
      const err = new Error('Path Not Found');
      err.httpStatus = 404;
      next(err);
    }
  };
}
export default { verify };
