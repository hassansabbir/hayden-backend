import { IMediaProvider } from '../media.interface';
import { LocalMediaProvider } from './localMediaProvider';
import { CloudinaryMediaProvider } from './cloudinaryMediaProvider';
import { env } from '../../../config/env';

export const getMediaProvider = (): IMediaProvider => {
  switch (env.MEDIA_PROVIDER) {
    case 'CLOUDINARY':
      return new CloudinaryMediaProvider();
    case 'LOCAL':
    default:
      return new LocalMediaProvider();
  }
};
