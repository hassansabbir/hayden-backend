import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(1).max(1000),
  images: z.array(z.string()).max(6).optional(),
});

export const courseIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listReviewsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});
