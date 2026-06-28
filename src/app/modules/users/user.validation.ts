import { z } from 'zod';

export const updateMeSchema = z.object({
  fullName: z.string().min(2).max(80).optional(),
  phone: z.string().min(5).max(20).optional(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const userIdParamSchema = z.object({
  id: z.string().min(1),
});

export const getUsersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  role: z.string().optional(),
});
