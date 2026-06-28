import { Document, Types } from 'mongoose';

export type MediaType = 'COURSE_HERO' | 'COURSE_GALLERY' | 'SIGNATURE_HOLE' | 'USER_AVATAR' | 'REVIEW_IMAGE';
export type MediaProviderName = 'LOCAL' | 'CLOUDINARY';
export type MediaRelatedModel = 'Course' | 'User' | 'Review';

export interface IMedia extends Document {
  url: string;
  publicId: string;
  provider: MediaProviderName;
  type: MediaType;
  relatedTo?: Types.ObjectId;
  relatedModel?: MediaRelatedModel;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
}

// The seam a future Cloudinary (or S3, etc.) integration plugs into without
// touching the service/controller/route layer.
export interface IUploadedFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface IUploadResult {
  url: string;
  publicId: string;
  provider: MediaProviderName;
  width?: number;
  height?: number;
}

export interface IMediaProvider {
  upload(file: IUploadedFile): Promise<IUploadResult>;
  delete(publicId: string): Promise<void>;
}
