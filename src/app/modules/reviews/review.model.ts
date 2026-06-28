import { Schema, model } from 'mongoose';
import { IReview } from './review.interface';
import { Course } from '../golfCourses/course.model';

const reviewSchema = new Schema<IReview>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 1000 },
    images: [{ type: Schema.Types.ObjectId, ref: 'Media' }],
    status: { type: String, enum: ['PUBLISHED', 'FLAGGED', 'REMOVED'], default: 'PUBLISHED' },
  },
  { timestamps: true }
);

reviewSchema.index({ course: 1, user: 1 }, { unique: true });
reviewSchema.index({ course: 1, rating: -1 });

const recomputeCourseRating = async (courseId: Schema.Types.ObjectId) => {
  const [aggregate] = await model<IReview>('Review').aggregate([
    { $match: { course: courseId, status: 'PUBLISHED' } },
    { $group: { _id: '$course', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Course.findByIdAndUpdate(courseId, {
    rating: aggregate ? Number(aggregate.avgRating.toFixed(1)) : 0,
    reviewsCount: aggregate ? aggregate.count : 0,
  });
};

reviewSchema.post('save', async function () {
  await recomputeCourseRating(this.course as unknown as Schema.Types.ObjectId);
});

reviewSchema.post('deleteOne', { document: true, query: false }, async function () {
  await recomputeCourseRating(this.course as unknown as Schema.Types.ObjectId);
});

export const Review = model<IReview>('Review', reviewSchema);
