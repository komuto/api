import validate from 'validate.js';
import multer from 'multer';
import path from 'path';
import config from '../../../config';
import { BadRequestError } from '../../../common/errors';

const upload = multer().single('image');

export function validateParam(constraints) {
  return (req, res, next) => {
    upload(req, res, () => {
      req.body.image = req.file;
      const hasError = validate(req.body, constraints);
      if (hasError) {
        const err = new BadRequestError('Invalid parameter');
        err.data = hasError;
        return next(err);
      }
      return next();
    });
  };
}

export function imagePath() {
  return (req, res, next) => {
    let folder = '';
    switch (req.body.type) {
      case 'store':
        folder = config.imageFolder.store;
        break;
      default:
        break;
    }

    const file = req.file;
    file.filename = `${req.body.type}-${Date.now()}${path.extname(file.originalname)}`;
    file.destination = config.imagePath;
    file.path = `${file.destination}/${folder}/${file.filename}`;
    req.body.image = file;
    return next();
  };
}
