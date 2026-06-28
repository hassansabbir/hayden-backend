import { z } from 'zod';
import { HOLES_PREFERENCE } from './booking.constant';

// Matches Reserve.tsx exactly.
export const createBookingSchema = z.object({
  teeTimeId: z.string().min(1),
  fullName: z.string().min(2).max(80),
  phoneNumber: z.string().min(5).max(20),
  email: z.string().email(),
  holesPreference: z.enum(HOLES_PREFERENCE),
  players: z.coerce.number().min(1).max(4),
  specialRequests: z.string().max(500).optional(),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms to book' }),
  }),
});

// Matches Bookings.tsx's "track a booking" form.
export const lookupBookingQuerySchema = z.object({
  email: z.string().email(),
  bookingId: z.string().min(1),
});

export const bookingIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listBookingsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.string().optional(),
});
