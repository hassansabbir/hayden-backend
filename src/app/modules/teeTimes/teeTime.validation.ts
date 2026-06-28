import { z } from 'zod';
import { BOOKING_TYPES } from './teeTime.constant';

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Matches AddTeaTime.tsx's nested field-array shape: one date per schedule,
// multiple {from, to} slot pairs per schedule, submitted together.
// price/capacity/bookingType aren't collected by that form yet — see
// ARCHITECTURE.md implementation notes; they're required here since a real
// bookable slot can't have an undefined price, and the frontend will need a
// small follow-up addition to collect them.
const slotSchema = z.object({
  from: z.string().regex(timePattern, 'from must be HH:mm'),
  to: z.string().regex(timePattern, 'to must be HH:mm'),
  price: z.coerce.number().min(0),
  capacity: z.coerce.number().min(1).max(4),
  bookingType: z.enum(BOOKING_TYPES as [string, ...string[]]).optional(),
});

const scheduleSchema = z.object({
  date: z.coerce.date(),
  slots: z.array(slotSchema).min(1),
});

export const bulkCreateTeeTimesSchema = z.object({
  schedules: z.array(scheduleSchema).min(1),
});

export const updateTeeTimeSchema = z.object({
  startTime: z.string().regex(timePattern).optional(),
  endTime: z.string().regex(timePattern).optional(),
  price: z.coerce.number().min(0).optional(),
  capacity: z.coerce.number().min(1).max(4).optional(),
  bookingType: z.enum(BOOKING_TYPES as [string, ...string[]]).optional(),
  status: z.enum(['ACTIVE', 'CANCELLED']).optional(),
});

export const teeTimeIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listTeeTimesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  date: z.string().optional(),
});
