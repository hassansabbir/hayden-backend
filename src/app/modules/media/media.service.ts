import { Media } from './media.model';
import { IMedia, IUploadedFile, MediaRelatedModel, MediaType } from './media.interface';
import { getMediaProvider } from './providers/mediaProvider.factory';
import { AppError } from '../../errors/AppError';

interface UploadMediaInput {
  type: MediaType;
  relatedTo?: string;
  relatedModel?: MediaRelatedModel;
  uploadedBy: string;
}

export const uploadMedia = async (file: IUploadedFile, payload: UploadMediaInput): Promise<IMedia> => {
  const provider = getMediaProvider();
  const result = await provider.upload(file);

  return Media.create({
    url: result.url,
    publicId: result.publicId,
    provider: result.provider,
    type: payload.type,
    relatedTo: payload.relatedTo,
    relatedModel: payload.relatedModel,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    width: result.width,
    height: result.height,
    uploadedBy: payload.uploadedBy,
  });
};

export const deleteMedia = async (mediaId: string): Promise<void> => {
  const media = await Media.findById(mediaId);
  if (!media) throw new AppError(404, 'Media not found');

  const provider = getMediaProvider();
  await provider.delete(media.publicId);
  await media.deleteOne();
};
