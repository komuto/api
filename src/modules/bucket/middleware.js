import validate from 'validate.js';
import { middleware } from '../core';
import messages from '../core/messages';

const { formatError } = middleware;

export function validateCart() {
  return (req, res, next) => {
    const hasError = validate({ product_id: String(req.body.product_id) }, {
      product_id: { format: /([0-9]{1,10}.[0-9]{1,10})/ },
    });
    return next(formatError(messages.bad_request.parameter, hasError));
  };
}
