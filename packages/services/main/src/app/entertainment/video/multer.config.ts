import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import path from 'path';

export const multerOptions = {
  storage: diskStorage({
    filename: (_req, file, cb) => {
      const fileExt = path.extname(file.originalname);
      const fileName = `${uuid()}${fileExt}`;
      cb(null, fileName);
    },
  }),
  fileFilter: (_req: any, file: { mimetype: string; }, cb: (arg0: Error | null, arg1: boolean) => void) => {
    if (!file.mimetype.startsWith('video/')) {
      return cb(new Error('Only video files are allowed!'), false);
    }
    cb(null, true);
  },
};
