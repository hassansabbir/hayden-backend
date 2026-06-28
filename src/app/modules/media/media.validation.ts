import { z } from 'zod';

export const uploadMediaSchema = z.object({
  type: z.enum(['COURSE_HERO', 'COURSE_GALLERY', 'SIGNATURE_HOLE', 'USER_AVATAR', 'REVIEW_IMAGE']),
  relatedTo: z.string().optional(),
  relatedModel: z.enum(['Course', 'User', 'Review']).optional(),
});

export const mediaIdParamSchema = z.object({
  id: z.string().min(1),
});
