import { z } from 'zod';

// Backs AllClubs.tsx's "Create New Club" modal — provisions a new
// COURSE_MANAGER account plus a PENDING course in one request.
export const createCourseSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(72),
});

const statsSchema = z.object({
  yardage: z.string().optional(),
  par: z.coerce.number().optional(),
  slope: z.coerce.number().optional(),
  rating: z.coerce.number().optional(),
  holes: z.coerce.number().optional(),
  tees: z.coerce.number().optional(),
  elevation: z.string().optional(),
  avgTime: z.string().optional(),
  courseType: z.string().optional(),
  difficulty: z.string().optional(),
});

const sellingPointSchema = z.object({
  title: z.string().max(120).optional(),
  description: z.string().max(500).optional(),
});

const facilitySchema = z.object({
  name: z.string().max(120).optional(),
  description: z.string().max(300).optional(),
});

const signatureHoleSchema = z.object({
  number: z.string().optional(),
  name: z.string().optional(),
  par: z.coerce.number().optional(),
  yardage: z.coerce.number().optional(),
  notes: z.string().max(1000).optional(),
  image: z.string().optional(),
});

const holeVideoSchema = z.object({
  holeNumber: z.number().int().min(1).max(18),
  url: z.string().url(),
});

// Backs EditClub.tsx in full — every field the club-owner form submits.
// Note: summary/description/heroImage allow empty string so the club owner
// can save a partially-completed draft without triggering validation errors.
// Completeness is enforced at approval time (see course.service.ts).
export const updateMyCourseSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  location: z.string().min(1).optional(),
  summary: z.string().max(300).or(z.literal('')).optional(),
  description: z.string().max(4000).or(z.literal('')).optional(),
  heroImage: z.string().or(z.literal('')).optional(),
  stats: statsSchema.optional(),
  sellingPoints: z.array(sellingPointSchema).max(6).optional(),
  facilities: z.array(facilitySchema).max(12).optional(),
  signatureHole: signatureHoleSchema.optional(),
  gallery: z.array(z.string()).max(20).optional(),
  holeVideos: z.array(holeVideoSchema).max(18).optional(),
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
  holes: z.string().optional(),
});

export const adminListCoursesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
});

export const getPublicTeeTimesQuerySchema = z.object({
  date: z.string().optional(),
});
