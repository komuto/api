import validate from 'validate.js';
import constraints from './validation';
import { BadRequestError } from '../../../common/errors';

export function validateSearch() {
  return (req, res, next) => {
    const hasError = validate(req.query, constraints.search);
    if (hasError) {
      const err = new BadRequestError('Invalid parameter');
      err.data = hasError;
      return next(err);
    }
    return next();
  };
}
