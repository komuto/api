import fs from 'fs';
import _ from 'lodash';
import Promise from 'bluebird';
import { uploadError } from './messages';
import core from '../core';
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

  const data = { path: `${config.assetUrl}/uploads/${config.imageFolder[req.body.type]}` };
  data[req.body.is_single ? 'image' : 'images'] = req.body.is_single ? names[0] : names;

  req.resData = { data };
  return next();
};
