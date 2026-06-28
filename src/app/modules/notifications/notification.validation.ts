import { z } from 'zod';

export const notificationIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listNotificationsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});
