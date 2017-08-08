import fs from 'fs';
import _ from 'lodash';
import Promise from 'bluebird';
import { uploadError } from './messages';
import config from '../../../config';

export const ImageController = {};
export default { ImageController };

ImageController.upload = async (req, res, next) => {
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
    throw uploadError('image', 'error');
  });

  req.resData = {
    data: {
      path: `${config.assetUrl}/uploads/${req.body.folder}`,
      images: names,
    },
  };
  return next();
};
