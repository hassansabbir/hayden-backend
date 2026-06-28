import mongoose from 'mongoose';
import { Course } from './course.model';
import { ICourse } from './course.interface';
import { User } from '../users/user.model';
import { ROLE } from '../users/user.constant';
import { COURSE_STATUS } from './course.constant';
import { AppError } from '../../errors/AppError';
import { slugify } from '../../utils/slugify';
import { calculatePagination, buildMeta, PaginationQuery } from '../../utils/paginationHelper';
import { TeeTime } from '../teeTimes/teeTime.model';
import { recordAuditLog } from '../auditLogs/auditLog.service';
import { createNotification } from '../notifications/notification.service';

const ensureUniqueSlug = async (name: string): Promise<string> => {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;

  while (await Course.exists({ slug: candidate })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

// Backs AllClubs.tsx's "Create New Club" modal: atomically provisions the
// owner account (forced to reset their admin-set password) and a PENDING course.
export const createCourseWithOwner = async (
  adminId: string,
  payload: { name: string; email: string; password: string }
): Promise<ICourse> => {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
  if (existingUser) throw new AppError(409, 'An account with this email already exists');

  const slug = await ensureUniqueSlug(payload.name);

  const session = await mongoose.startSession();
  try {
    let course: ICourse;
    await session.withTransaction(async () => {
      const [owner] = await User.create(
        [
          {
            fullName: payload.name,
            email: payload.email,
            passwordHash: payload.password,
            role: ROLE.COURSE_MANAGER,
            mustResetPassword: true,
            createdBy: adminId,
          },
        ],
        { session }
      );

      const [createdCourse] = await Course.create(
        [
          {
            name: payload.name,
            slug,
            owner: owner._id,
            location: 'Pending Setup',
            status: COURSE_STATUS.PENDING,
            createdBy: adminId,
          },
        ],
        { session }
      );

      owner.course = createdCourse._id as mongoose.Types.ObjectId;
      await owner.save({ session });

      course = createdCourse;
    });

    return course!;
  } finally {
    await session.endSession();
  }
};

interface ListCoursesFilters extends PaginationQuery {
  search?: string;
  priceMin?: string;
  priceMax?: string;
}

export const listPublicCourses = async (filters: ListCoursesFilters) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(filters);

  const conditions: Record<string, unknown>[] = [{ status: COURSE_STATUS.ACTIVE }];
  if (filters.search) conditions.push({ $text: { $search: filters.search } });
  if (filters.priceMin || filters.priceMax) {
    const priceFilter: Record<string, number> = {};
    if (filters.priceMin) priceFilter.$gte = Number(filters.priceMin);
    if (filters.priceMax) priceFilter.$lte = Number(filters.priceMax);
    conditions.push({ 'priceRange.min': priceFilter });
  }

  const whereClause = { $and: conditions };

  const [courses, total] = await Promise.all([
    Course.find(whereClause)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .populate('heroImage'),
    Course.countDocuments(whereClause),
  ]);

  return { courses, meta: buildMeta(page, limit, total) };
};

export const listFeaturedCourses = async (): Promise<ICourse[]> => {
  return Course.find({ status: COURSE_STATUS.ACTIVE, isFeatured: true }).populate('heroImage');
};

export const getCourseBySlug = async (slug: string): Promise<ICourse> => {
  const course = await Course.findOne({ slug, status: COURSE_STATUS.ACTIVE })
    .populate('heroImage')
    .populate('gallery')
    .populate('signatureHole.image');

  if (!course) throw new AppError(404, 'Course not found');
  return course;
};

export const getMyCourse = async (ownerId: string): Promise<ICourse> => {
  const course = await Course.findOne({ owner: ownerId })
    .populate('heroImage')
    .populate('gallery')
    .populate('signatureHole.image');
  if (!course) throw new AppError(404, 'No course is associated with this account');
  return course;
};

export const updateMyCourse = async (
  ownerId: string,
  payload: Partial<ICourse>
): Promise<ICourse> => {
  const course = await Course.findOneAndUpdate(
    { owner: ownerId },
    { ...payload, updatedBy: ownerId },
    { new: true, runValidators: true }
  )
    .populate('heroImage')
    .populate('gallery')
    .populate('signatureHole.image');
  if (!course) throw new AppError(404, 'No course is associated with this account');
  return course;
};

interface AdminListCoursesFilters extends PaginationQuery {
  search?: string;
  status?: string;
}

export const adminListCourses = async (filters: AdminListCoursesFilters) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(filters);

  const conditions: Record<string, unknown>[] = [];
  if (filters.search) conditions.push({ $text: { $search: filters.search } });
  if (filters.status) conditions.push({ status: filters.status });

  const whereClause = conditions.length ? { $and: conditions } : {};

  const [courses, total] = await Promise.all([
    Course.find(whereClause)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .populate('owner', 'fullName email'),
    Course.countDocuments(whereClause),
  ]);

  const teeTimeCounts = await TeeTime.aggregate([
    { $match: { course: { $in: courses.map((c) => c._id) } } },
    { $group: { _id: '$course', count: { $sum: 1 } } },
  ]);
  const countByCourse = new Map(teeTimeCounts.map((c) => [String(c._id), c.count]));

  const rows = courses.map((course) => ({
    id: course.id,
    name: course.name,
    location: course.location,
    owner: course.owner,
    status: course.status,
    teeTimeCount: countByCourse.get(String(course._id)) ?? 0,
  }));

  return { courses: rows, meta: buildMeta(page, limit, total) };
};

const REQUIRED_FOR_ACTIVE: (keyof ICourse)[] = ['summary', 'description', 'heroImage', 'stats', 'signatureHole'];

export const approveCourse = async (
  adminId: string,
  courseId: string,
  isFeatured?: boolean
): Promise<ICourse> => {
  const course = await Course.findById(courseId);
  if (!course) throw new AppError(404, 'Course not found');

  const missing = REQUIRED_FOR_ACTIVE.filter((field) => !course[field]);
  if (missing.length > 0) {
    throw new AppError(
      400,
      `Course profile is incomplete — missing: ${missing.join(', ')}. The owner must finish the Edit Club form before approval.`
    );
  }

  course.status = COURSE_STATUS.ACTIVE;
  if (isFeatured !== undefined) course.isFeatured = isFeatured;
  course.updatedBy = adminId as unknown as mongoose.Types.ObjectId;
  await course.save();

  await recordAuditLog(adminId, 'COURSE_APPROVED', 'Course', String(course._id));
  await createNotification(
    String(course.owner),
    'CLUB_APPROVED',
    'Your club has been approved',
    `${course.name} is now live and accepting bookings.`
  );

  return course;
};
