import { Review } from './review.model';
import { IReview } from './review.interface';
import { Booking } from '../bookings/booking.model';
import { AppError } from '../../errors/AppError';
import { calculatePagination, buildMeta, PaginationQuery } from '../../utils/paginationHelper';

export const createReview = async (
  userId: string,
  courseId: string,
  payload: { rating: number; comment: string; images?: string[] }
): Promise<IReview> => {
  const hasPlayed = await Booking.exists({ user: userId, course: courseId, status: 'CONFIRMED' });
  if (!hasPlayed) {
    throw new AppError(403, 'You can only review a course after a confirmed booking there');
  }

  try {
    return await Review.create({ course: courseId, user: userId, ...payload });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new AppError(409, 'You have already reviewed this course');
    }
    throw error;
  }
};

export const listReviewsForCourse = async (courseId: string, filters: PaginationQuery) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(filters);

  const whereClause = { course: courseId, status: 'PUBLISHED' };

  const [reviews, total] = await Promise.all([
    Review.find(whereClause)
      .sort({ [sortBy === 'createdAt' ? 'createdAt' : sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'fullName avatar'),
    Review.countDocuments(whereClause),
  ]);

  return { reviews, meta: buildMeta(page, limit, total) };
};
