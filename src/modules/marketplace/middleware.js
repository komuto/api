import core from '../core';
import { Marketplace } from './model';
import { BadRequestError } from '../../../common/errors';

const { wrap } = core.utils;

export function verify() {
  const fn = async (req, res, next) => {
    const id = req.subdomains[req.subdomains.length - 1];
    const marketplace = await Marketplace.findById(id);
    if (!marketplace) throw new BadRequestError('Marketplace Not Found');
    req.marketplace = marketplace;
    next();
  };
  return wrap(fn);
}
export default { verify };
