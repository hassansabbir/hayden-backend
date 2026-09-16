import { z } from 'zod';


// Backs AllClubs.tsx's "Create New Club" modal — provisions a new
// COURSE_MANAGER account plus a PENDING course in one request.
export const createCourseSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(72),
});

const statsSchema = z.object({
  yardage: z.string().optional().or(z.literal('')),
  par: z.coerce.number().optional().or(z.literal(0)),
  slope: z.coerce.number().optional().or(z.literal(0)),
  rating: z.coerce.number().optional().or(z.literal(0)),
  holes: z.coerce.number().optional().or(z.literal(0)),
  tees: z.coerce.number().optional().or(z.literal(0)),
  elevation: z.string().optional().or(z.literal('')),
  avgTime: z.string().optional().or(z.literal('')),
  courseType: z.string().optional().or(z.literal('')),
  difficulty: z.string().optional().or(z.literal('')),
});

const sellingPointSchema = z.object({
  title: z.string().max(120).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
});

const facilitySchema = z.object({
  name: z.string().max(120).optional().or(z.literal('')),
  description: z.string().max(300).optional().or(z.literal('')),
});

const signatureHoleSchema = z.object({
  number: z.string().optional().or(z.literal('')),
  name: z.string().optional().or(z.literal('')),
  par: z.coerce.number().optional().or(z.literal(0)),
  yardage: z.coerce.number().optional().or(z.literal(0)),
  notes: z.string().max(1000).optional().or(z.literal('')),
  image: z.string().optional().or(z.literal('')),
});

const holeVideoSchema = z.object({
  holeNumber: z.coerce.number().optional().or(z.literal(0)),
  url: z.string().optional().or(z.literal('')),
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
