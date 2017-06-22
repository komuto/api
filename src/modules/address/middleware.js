import validate from 'validate.js';
import constraints from './validation';
import { BadRequestError } from '../../../common/errors';

/**
 * Create Address validation middleware
 */
export function validateCreate() {
  return (req, res, next) => {
    const hasError = validate(req.body, constraints.createAddress, { format: 'flat' });
    if (hasError) {
      return next(new BadRequestError(hasError));
    }
    return next();
  };
}

export function validateUpdate() {
  return (req, res, next) => {
    const hasError = validate(req.body, constraints.updateAddress, { format: 'flat' });
    if (hasError) {
      return next(new BadRequestError(hasError));
    }
    return next();
  };
}
