import validate from 'validate.js';
import { BadRequestError } from '../../../common/errors';

export function validateParam(constraints) {
  return (req, res, next) => {
    const hasError = validate(req.body, constraints);
    if (hasError) {
      const err = new BadRequestError('Invalid parameter');
      err.data = hasError;
      return next(err);
    }
    return next();
  };
}
