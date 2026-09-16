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
import { sendMail } from '../../utils/mailer';
import { renderClubWelcomeEmail, renderClubApprovedEmail, renderAdminCourseApprovedEmail } from '../../utils/emailTemplates';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

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
  let course: ICourse;
  try {
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
  } finally {
    await session.endSession();
  }

  // Transaction committed — fire the welcome email outside the session so a
  // transient SMTP failure never rolls back or 500s the club creation response.
  try {
    await sendMail({
      to: payload.email,
      subject: 'Welcome to Tee It Up — your club account is ready',
      html: renderClubWelcomeEmail({
        clubName: payload.name,
        email: payload.email,
        password: payload.password,   // plain text, captured before the pre-save hash
        loginUrl: `${env.CLIENT_DASHBOARD_URL}/sign-in`,
      }),
    });
  } catch (err) {
    logger.error('Failed to send club welcome email', { err, to: payload.email });
  }

  return course!;
};

interface ListCoursesFilters extends PaginationQuery {
  search?: string;
  priceMin?: string;
  priceMax?: string;
  session?: string;
  players?: string;
  holes?: string;
}

export const listPublicCourses = async (filters: ListCoursesFilters) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(filters);

  const conditions: Record<string, unknown>[] = [{ status: COURSE_STATUS.ACTIVE }];
  if (filters.search) {
    conditions.push({
      $or: [
        { name: { $regex: filters.search, $options: 'i' } },
        { location: { $regex: filters.search, $options: 'i' } },
      ],
    });
  }
  if (filters.priceMin || filters.priceMax) {
    const priceFilter: Record<string, number> = {};
    if (filters.priceMin) priceFilter.$gte = Number(filters.priceMin);
    if (filters.priceMax) priceFilter.$lte = Number(filters.priceMax);
    conditions.push({ 'priceRange.min': priceFilter });
  }

  if (filters.holes) {
    conditions.push({ 'stats.holes': Number(filters.holes) });
  }

  if (filters.session || filters.players) {
    const teeTimeQuery: Record<string, any> = { status: 'ACTIVE' };
    if (filters.session) {
      teeTimeQuery.session = filters.session;
    }
    if (filters.players) {
      const neededPlayers = Number(filters.players);
      teeTimeQuery.$expr = {
        $gte: [{ $subtract: ['$capacity', '$bookedCount'] }, neededPlayers]
      };
    }
    const matchingTeeTimes = await TeeTime.find(teeTimeQuery).select('course');
    const courseIds = matchingTeeTimes.map((t) => t.course);
    conditions.push({ _id: { $in: courseIds } });
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
  if (filters.search) {
    conditions.push({
      $or: [
        { name: { $regex: filters.search, $options: 'i' } },
        { location: { $regex: filters.search, $options: 'i' } },
      ],
    });
  }
  if (filters.status) conditions.push({ status: filters.status });

  const whereClause = conditions.length ? { $and: conditions } : {};

  const [courses, total] = await Promise.all([
    Course.find(whereClause)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .populate('owner', 'fullName email')
      .populate('heroImage')
      .populate('signatureHole.image'),
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
    isFeatured: course.isFeatured,
    teeTimeCount: countByCourse.get(String(course._id)) ?? 0,
    summary: course.summary,
    description: course.description,
    heroImage: course.heroImage,
    stats: course.stats,
    signatureHole: course.signatureHole,
    sellingPoints: course.sellingPoints,
    facilities: course.facilities,
  }));

  return { courses: rows, meta: buildMeta(page, limit, total) };
};

export const approveCourse = async (
  adminId: string,
  courseId: string,
  isFeatured?: boolean
): Promise<ICourse> => {
  const course = await Course.findById(courseId);
  if (!course) throw new AppError(404, 'Course not found');

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

  // Send approval email to the club owner and a confirmation to the admin (best-effort).
  try {
    const owner = await User.findById(course.owner).select('email fullName');
    const admin = await User.findById(adminId).select('email');

    if (owner) {
      await sendMail({
        to: owner.email,
        subject: `Great news — ${course.name} is now live on Tee It Up!`,
        html: renderClubApprovedEmail({
          clubName: course.name,
          ownerName: owner.fullName,
          dashboardUrl: `${env.CLIENT_DASHBOARD_URL}`,
        }),
      });
    }

    if (admin && owner) {
      await sendMail({
        to: admin.email,
        subject: `Course Approved: ${course.name}`,
        html: renderAdminCourseApprovedEmail({
          clubName: course.name,
          clubEmail: owner.email,
        }),
      });
    }
  } catch (err) {
    logger.error('Failed to send club approval emails', { err, courseId: course.id });
  }

  return course;
};

export const getPublicTeeTimes = async (slug: string, dateStr?: string) => {
  const course = await Course.findOne({ slug, status: COURSE_STATUS.ACTIVE });
  if (!course) {
    throw new AppError(404, 'Course not found');
  }

  const whereClause: Record<string, any> = {
    course: course._id,
    status: 'ACTIVE',
    bookedCount: 0,
  };

  if (dateStr) {
    const day = new Date(dateStr);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    whereClause.date = { $gte: day, $lt: nextDay };
  }

  const teeTimes = await TeeTime.find(whereClause)
    .sort({ date: 1, startTime: 1 });

  return teeTimes;
};
