import { v2 as cloudinary } from 'cloudinary';
import { IMediaProvider, IUploadedFile, IUploadResult } from '../media.interface';
import { env } from '../../../config/env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export class CloudinaryMediaProvider implements IMediaProvider {
  async upload(file: IUploadedFile): Promise<IUploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'tea-it-up', resource_type: 'auto' },
        (error, result) => {
          if (error || !result) {
            return reject(error ?? new Error('Cloudinary upload returned no result'));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            provider: 'CLOUDINARY',
            width: result.width,
            height: result.height,
          });
        },
      );
      stream.end(file.buffer);
    });
  }

  async delete(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
