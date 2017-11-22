import fs from 'fs';
import _ from 'lodash';
import Promise from 'bluebird';
import sharp from 'sharp';
import { uploadError } from './messages';
import config from '../../../config';

export const ImageController = {};
export default { ImageController };

ImageController.upload = async (req, res, next) => {
  const images = req.body.images;
  const names = [];
  const promises = _.map(images, (image) => {
    names.push({ name: image.filename });
    return new Promise(async (resolve, reject) => {
      try {
        const imageResize = sharp(image.buffer);
        const data = await imageResize.metadata()
          .then((metadata) => {
            if (metadata.width > config.imageMaxWidth) {
              return imageResize
                .resize(config.imageMaxWidth)
                .toBuffer();
            }
            return imageResize.toBuffer();
          });

        fs.writeFile(image.path, data, (err) => {
          if (err) reject(err);
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  });

  await Promise.all(promises).catch(() => {
    throw uploadError('image', 'error');
  });

  req.resData = {
    data: {
      path: `https://${req.marketplace.mobile_domain}/assets/${req.body.folder}`,
      images: names,
    },
  };
  return next();
};
