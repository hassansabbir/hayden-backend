import { IMediaProvider } from '../media.interface';
import { LocalMediaProvider } from './localMediaProvider';
import { env } from '../../../config/env';

// Only LOCAL is implemented today (see ARCHITECTURE.md — no Cloudinary
// credentials yet). Adding Cloudinary later means writing a
// CloudinaryMediaProvider class here and returning it when
// env.MEDIA_PROVIDER === 'CLOUDINARY' — nothing above this factory changes.
export const getMediaProvider = (): IMediaProvider => {
  switch (env.MEDIA_PROVIDER) {
    case 'LOCAL':
    default:
      return new LocalMediaProvider();
  }
};
