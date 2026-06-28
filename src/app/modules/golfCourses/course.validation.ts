import { z } from 'zod';
import { HOLES_OPTIONS } from './course.constant';

// Backs AllClubs.tsx's "Create New Club" modal — provisions a new
// COURSE_MANAGER account plus a PENDING course in one request.
export const createCourseSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(72),
});

const statsSchema = z.object({
  yardage: z.string().min(1),
  par: z.coerce.number().min(27).max(90),
  slope: z.coerce.number().min(55).max(155),
  rating: z.coerce.number().min(0).max(100),
  holes: z.coerce.number().refine((v) => (HOLES_OPTIONS as readonly number[]).includes(v), {
    message: 'holes must be 9 or 18',
  }),
  tees: z.coerce.number().min(1),
  elevation: z.string().min(1),
  avgTime: z.string().min(1),
  courseType: z.string().min(1),
  difficulty: z.string().min(1),
});

const sellingPointSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
});

const facilitySchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(300),
});

const signatureHoleSchema = z.object({
  number: z.string().min(1),
  name: z.string().min(1),
  par: z.coerce.number(),
  yardage: z.coerce.number(),
  notes: z.string().min(1).max(1000),
  image: z.string().min(1),
});

// Backs EditClub.tsx in full — every field the club-owner form submits.
export const updateMyCourseSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  location: z.string().min(1).optional(),
  summary: z.string().min(1).max(300).optional(),
  description: z.string().min(1).max(4000).optional(),
  heroImage: z.string().min(1).optional(),
  stats: statsSchema.optional(),
  sellingPoints: z.array(sellingPointSchema).min(1).max(6).optional(),
  facilities: z.array(facilitySchema).max(12).optional(),
  signatureHole: signatureHoleSchema.optional(),
  gallery: z.array(z.string().min(1)).max(20).optional(),
});

export const approveCourseSchema = z.object({
  isFeatured: z.boolean().optional(),
});

export const courseIdParamSchema = z.object({
  id: z.string().min(1),
});

export const courseSlugParamSchema = z.object({
  slug: z.string().min(1),
});

export const listCoursesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  priceMin: z.string().optional(),
  priceMax: z.string().optional(),
  session: z.enum(['EARLY_MORNING', 'MIDDAY', 'AFTERNOON', 'TWILIGHT']).optional(),
  players: z.string().optional(),
});

export const adminListCoursesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
});
