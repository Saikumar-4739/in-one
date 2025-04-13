// multer.config.ts
import { memoryStorage } from 'multer';
import { extname } from 'path';

export const multerOptions = {
  storage: memoryStorage(), // Store files in memory instead of disk
  fileFilter: (req: any, file: { originalname: string; mimetype: string; }, cb: (arg0: Error | null, arg1: boolean) => void) => {
    const allowedTypes = /mp4|mov|avi/;
    const ext = extname(file.originalname).toLowerCase();
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files (mp4, mov, avi) are allowed'), false);
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
};