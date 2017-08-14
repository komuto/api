import { Marketplace } from './model';
import { BadRequestError } from '../../../common/errors';

export function verify() {
  return async (req, res, next) => {
    const marketplace = await Marketplace.findById(req.params.mp);
    if (!marketplace) next(new BadRequestError('Marketplace Not Found'));
    req.marketplace = marketplace.serialize();
    next();
  };
}
export default { verify };
