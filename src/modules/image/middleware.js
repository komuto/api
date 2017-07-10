import validate from 'validate.js';
import multer from 'multer';
import path from 'path';
import _ from 'lodash';
import config from '../../../config';
import { BadRequestError } from '../../../common/errors';
import constraints from './validation';

const upload = multer().single('image');
const uploadMulti = multer().array('images');

export function validateParam() {
  return (req, res, next) => {
    upload(req, res, () => {
      req.body.image = req.file;
      const hasError = validate(req.body, constraints.single);
      if (hasError) {
        const err = new BadRequestError('Invalid parameter');
        err.data = hasError;
        return next(err);
      }
      return next();
    });
  };
}

export function validateParamMulti() {
  return (req, res, next) => {
    uploadMulti(req, res, () => {
      req.body.images = req.files;
      const hasError = validate(req.body, constraints.multi);
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

export function imagePathMulti() {
  return (req, res, next) => {
    let folder = '';
    switch (req.body.type) {
      case 'product':
        folder = config.imageFolder.product;
        break;
      default:
        break;
    }

    req.body.images = _.map(req.body.images, (image, i) => {
      image.filename = `${req.body.type}-${Date.now()}-${i}${path.extname(image.originalname)}`;
      image.destination = config.imagePath;
      image.path = `${image.destination}/${folder}/${image.filename}`;
      return image;
    });

    return next();
  };
}
