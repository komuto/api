import multer from 'multer';
import path from 'path';
import config from '../../../config';
import { BadRequestError } from '../../../common/errors';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.imagePath);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage }).single('image');

export const ImageController = {};
export default { ImageController };

ImageController.singleImage = async (req, res, next) => {
  upload(req, res, (err) => {
    if (err) throw new BadRequestError('Gagal upload image');
    req.resData = {
      message: 'success',
      data: { name: req.file.filename },
    };
    return next();
  });
};
