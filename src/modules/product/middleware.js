import validate from 'validate.js';
import { BadRequestError } from '../../../common/errors';

/**
 * Validate parameters
 * @param constraints {object}
 */
export function validateManageProductsParam(constraints) {
  return (req, res, next) => {
    const hasError = validate(req.body, constraints);
    if (hasError || !validate.isArray(req.body.product_ids)) {
      const err = new BadRequestError('Invalid parameter');
      if (!hasError) {
        err.data = { product_ids: ['Product ids must array'] };
      } else {
        err.data = hasError;
      }
      return next(err);
    }
    return next();
  };
}

export default { validateManageProductsParam };
