// multer.config.ts
import { memoryStorage } from 'multer';
import { extname } from 'path';

export const photMulterOptions = {
  storage: memoryStorage(), // Store files in memory instead of disk
  fileFilter: (req: any, file: { originalname: string; mimetype: string; }, cb: (arg0: Error | null, arg1: boolean) => void) => {
    const allowedTypes = /jpeg|jpg|png|gif/; // Updated for image types
    const ext = extname(file.originalname).toLowerCase();
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit (adjusted for photos, can be changed as needed)
};