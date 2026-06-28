import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/requireRole';
import { validateRequest } from '../../middlewares/validateRequest';
import { ROLE } from '../users/user.constant';
import * as reviewController from './review.controller';
import { courseIdParamSchema, createReviewSchema, listReviewsQuerySchema } from './review.validation';

// Mounted at /api/v1/courses/:id/reviews — see routes/index.ts
const router = Router({ mergeParams: true });

router.get(
  '/',
  validateRequest({ params: courseIdParamSchema, query: listReviewsQuerySchema }),
  reviewController.listReviewsForCourse
);

router.post(
  '/',
  auth,
  requireRole(ROLE.USER),
  validateRequest({ params: courseIdParamSchema, body: createReviewSchema }),
  reviewController.createReview
);

export const reviewRoutes = router;
