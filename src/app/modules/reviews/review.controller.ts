import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import * as reviewService from './review.service';

export const createReview = catchAsync(async (req: Request, res: Response) => {
  const review = await reviewService.createReview(req.user!.userId, req.params.id, req.body);
  sendResponse(res, { statusCode: 201, message: 'Review submitted successfully', data: review });
});

export const listReviewsForCourse = catchAsync(async (req: Request, res: Response) => {
  const { reviews, meta } = await reviewService.listReviewsForCourse(req.params.id, req.query);
  sendResponse(res, { statusCode: 200, message: 'Reviews retrieved successfully', data: reviews, meta });
});
