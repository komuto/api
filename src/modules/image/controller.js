import fs from 'fs';
import _ from 'lodash';
import Promise from 'bluebird';
import { BadRequestError } from '../../../common/errors';

export const ImageController = {};
export default { ImageController };

ImageController.singleImage = async (req, res, next) => {
  const image = req.body.image;
  fs.writeFile(image.path, image.buffer, (err) => {
    if (err) throw new BadRequestError('Gagal upload image');
    req.resData = {
      message: 'success',
      data: { name: image.filename },
    };
    return next();
  });
};

ImageController.multiImages = async (req, res, next) => {
  const images = req.body.images;
  const names = [];
  const promises = _.map(images, (image) => {
    names.push({ name: image.filename });
    return new Promise((resolve, reject) => {
      fs.writeFile(image.path, image.buffer, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  });

  await Promise.all(promises).catch(() => {
    throw new BadRequestError('Gagal upload image');
  });

  req.resData = {
    message: 'success',
    data: names,
  };
  return next();
};
