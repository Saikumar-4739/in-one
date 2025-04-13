import { UploadApiResponse } from 'cloudinary';

export interface CloudinaryService {
  uploader: {
    destroy(cloudinaryPublicId: string, arg1: { resource_type: string; }): unknown;
    upload_stream: (
      options: object,
      callback: (error: Error | null, result?: UploadApiResponse) => void
    ) => NodeJS.WritableStream;
  };
}
