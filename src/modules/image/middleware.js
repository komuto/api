import validate from 'validate.js';
import multer from 'multer';
import path from 'path';
import _ from 'lodash';
import config from '../../../config';
import { BadRequestError } from '../../../common/errors';
import constraints from './validation';

const upload = multer().array('images');

const getImageType = (body) => {
  switch (body.type) {
    case 'product':
      body.folder = config.imageFolder.product;
      body.is_single = false;
      break;
    case 'store':
      body.folder = config.imageFolder.store;
      body.is_single = true;
      break;
    case 'payment':
      body.folder = config.imageFolder.payment;
      body.is_single = false;
      break;
    default:
      break;
  }
};

export function validateParam() {
  return (req, res, next) => {
    upload(req, res, () => {
      getImageType(req.body);
      req.body.images = req.files;
      const hasError = validate(req.body, constraints.upload);
      if (hasError) {
        const err = new BadRequestError('Invalid parameter');
        err.data = hasError;
        return next(err);
      }
      if (req.body.is_single && req.files.length !== 1) {
        const err = new BadRequestError('Must single images');
        return next(err);
      }
      return next();
    });
  };
}

export function imagePath() {
  return (req, res, next) => {
    req.body.images = _.map(req.body.images, (image, i) => {
      image.filename = `${req.body.type}-${Date.now()}-${i}${path.extname(image.originalname)}`;
      image.destination = config.imagePath;
      image.path = `${image.destination}/${req.body.folder}/${image.filename}`;
      return image;
    });
    return next();
  };
}
