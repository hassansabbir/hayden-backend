import { Schema, model } from 'mongoose';
import { IMedia } from './media.interface';

const mediaSchema = new Schema<IMedia>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    provider: { type: String, enum: ['LOCAL', 'CLOUDINARY'], default: 'LOCAL' },
    type: {
      type: String,
      enum: ['COURSE_HERO', 'COURSE_GALLERY', 'SIGNATURE_HOLE', 'USER_AVATAR', 'REVIEW_IMAGE'],
      required: true,
    },
    relatedTo: { type: Schema.Types.ObjectId, refPath: 'relatedModel' },
    relatedModel: { type: String, enum: ['Course', 'User', 'Review'] },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

mediaSchema.index({ relatedModel: 1, relatedTo: 1 });

export const Media = model<IMedia>('Media', mediaSchema);
