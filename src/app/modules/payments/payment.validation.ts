import { z } from 'zod';

export const createPaymentSchema = z.object({
  method: z.enum(['GUEST_CHECKOUT', 'CARD', 'MEMBERSHIP_CREDIT']),
});

export const bookingIdParamSchema = z.object({
  bookingId: z.string().min(1),
});
