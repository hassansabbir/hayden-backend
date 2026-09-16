import { Schema, model } from 'mongoose';
import { ICourse } from './course.interface';
import { COURSE_STATUS, COURSE_STATUSES } from './course.constant';
import { softDeletePlugin } from '../../utils/softDeletePlugin';

const statsSchema = new Schema(
  {
    yardage: { type: String, default: '' },
    par: { type: Number, default: 0 },
    slope: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    holes: { type: Number, default: 0 },
    tees: { type: Number, default: 0 },
    elevation: { type: String, default: '' },
    avgTime: { type: String, default: '' },
    courseType: { type: String, default: '' },
    difficulty: { type: String, default: '' },
  },
  { _id: false }
);

const sellingPointSchema = new Schema(
  {
    title: { type: String, maxlength: 120, default: '' },
    description: { type: String, maxlength: 500, default: '' },
  },
  { _id: false }
);

const facilitySchema = new Schema(
  {
    name: { type: String, maxlength: 120, default: '' },
    description: { type: String, maxlength: 300, default: '' },
  },
  { _id: false }
);

const signatureHoleSchema = new Schema(
  {
    number: { type: String, default: '' },
    name: { type: String, default: '' },
    par: { type: Number, default: 0 },
    yardage: { type: Number, default: 0 },
    notes: { type: String, maxlength: 1000, default: '' },
    image: { type: Schema.Types.ObjectId, ref: 'Media' },
  },
  { _id: false }
);

const holeVideoSchema = new Schema(
  {
    holeNumber: { type: Number, default: 0 },
    url: { type: String, default: '' },
  },
  { _id: false }
);

const priceRangeSchema = new Schema(
  {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
  },
  { _id: false }
);

const courseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    location: { type: String, required: true, trim: true },
    status: { type: String, enum: COURSE_STATUSES, default: COURSE_STATUS.PENDING },
    isFeatured: { type: Boolean, default: false },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewsCount: { type: Number, min: 0, default: 0 },
    // summary/description/heroImage/stats/signatureHole are required for an
    // ACTIVE course, but a freshly admin-provisioned PENDING course only has
    // name/email/password — the owner fills the rest in via the Edit Club
    // form. Completeness is enforced as a business rule at approval time
    // (see course.service.ts -> approveCourse), not as schema validators.
    summary: { type: String, maxlength: 300, default: '' },
    description: { type: String, maxlength: 4000, default: '' },
    heroImage: { type: Schema.Types.ObjectId, ref: 'Media' },
    stats: { type: statsSchema },
    sellingPoints: {
      type: [sellingPointSchema],
      validate: {
        validator: (value: unknown[]) => value.length <= 6,
        message: 'A course can have at most 6 selling points',
      },
      default: [],
    },
    facilities: {
      type: [facilitySchema],
      validate: {
        validator: (value: unknown[]) => value.length <= 12,
        message: 'A course can have at most 12 facilities',
      },
      default: [],
    },
    signatureHole: { type: signatureHoleSchema },
    gallery: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Media' }],
      validate: {
        validator: (value: unknown[]) => value.length <= 20,
        message: 'A course gallery can have at most 20 images',
      },
    },
    holeVideos: {
      type: [holeVideoSchema],
      validate: {
        validator: (value: unknown[]) => value.length <= 18,
        message: 'A course can have at most 18 hole videos',
      },
      default: [],
    },
    priceRange: { type: priceRangeSchema, default: () => ({ min: 0, max: 0 }) },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

courseSchema.plugin(softDeletePlugin);

courseSchema.index({ status: 1, isFeatured: 1 });
courseSchema.index({ name: 'text', location: 'text', summary: 'text' });

export const Course = model<ICourse>('Course', courseSchema);
