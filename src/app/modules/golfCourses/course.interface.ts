import { Document, Types } from 'mongoose';
import { CourseStatus } from './course.constant';

export interface ICourseStats {
  yardage: string;
  par: number;
  slope: number;
  rating: number;
  holes: number;
  tees: number;
  elevation: string;
  avgTime: string;
  courseType: string;
  difficulty: string;
}

export interface ISellingPoint {
  title: string;
  description: string;
}

export interface IFacility {
  name: string;
  description: string;
}

export interface ISignatureHole {
  number: string;
  name: string;
  par: number;
  yardage: number;
  notes: string;
  image: Types.ObjectId;
}

export interface IHoleVideo {
  holeNumber: number;
  url: string;
}

export interface IPriceRange {
  min: number;
  max: number;
}

export interface ICourse extends Document {
  name: string;
  slug: string;
  owner: Types.ObjectId;
  location: string;
  status: CourseStatus;
  isFeatured: boolean;
  rating: number;
  reviewsCount: number;
  summary?: string;
  description?: string;
  heroImage?: Types.ObjectId;
  stats?: ICourseStats;
  sellingPoints: ISellingPoint[];
  facilities: IFacility[];
  signatureHole?: ISignatureHole;
  gallery: Types.ObjectId[];
  holeVideos: IHoleVideo[];
  priceRange: IPriceRange;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
