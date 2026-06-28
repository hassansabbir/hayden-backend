import { Document, Types } from 'mongoose';

export type ReviewStatus = 'PUBLISHED' | 'FLAGGED' | 'REMOVED';

export interface IReview extends Document {
  course: Types.ObjectId;
  user: Types.ObjectId;
  booking?: Types.ObjectId;
  rating: number;
  comment: string;
  images: Types.ObjectId[];
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}
