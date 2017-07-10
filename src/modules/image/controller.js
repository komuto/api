import fs from 'fs';
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
