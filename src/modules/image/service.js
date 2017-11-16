import fs from 'fs';
import path from 'path';

export const ImageService = {};
export default { ImageService };

ImageService.deleteImage = (fileName, filePath) => {
  if (fileName === null || fileName === '') return;
  fileName = path.basename(fileName);
  fs.stat(path.join(filePath, fileName), (err) => {
    if (err) return true;
    return fs.unlink(path.join(filePath, fileName));
  });
};
