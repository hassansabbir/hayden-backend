import { TeeTime } from './teeTime.model';
import { ITeeTime } from './teeTime.interface';
import { Course } from '../golfCourses/course.model';
import { AppError } from '../../errors/AppError';
import { deriveSession } from '../../utils/deriveSession';
import { calculatePagination, buildMeta, PaginationQuery } from '../../utils/paginationHelper';

interface SlotInput {
  from: string;
  to: string;
  price: number;
  capacity: number;
  bookingType?: string;
}

interface ScheduleInput {
  date: Date;
  slots: SlotInput[];
}

const getOwnedCourseOrThrow = async (ownerId: string) => {
  const course = await Course.findOne({ owner: ownerId });
  if (!course) throw new AppError(404, 'No course is associated with this account');
  return course;
};

export const bulkCreateTeeTimes = async (
  ownerId: string,
  schedules: ScheduleInput[]
): Promise<ITeeTime[]> => {
  const course = await getOwnedCourseOrThrow(ownerId);

  const documents = schedules.flatMap((schedule) =>
    schedule.slots.map((slot) => ({
      course: course._id,
      date: schedule.date,
      startTime: slot.from,
      endTime: slot.to,
      session: deriveSession(slot.from),
      bookingType: slot.bookingType ?? 'INSTANT',
      price: slot.price,
      capacity: slot.capacity,
      createdBy: ownerId,
    }))
  );

  try {
    return await TeeTime.insertMany(documents, { ordered: true });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new AppError(409, 'One or more of these slots already exist for that date');
    }
    throw error;
  }
};

export const listMyTeeTimes = async (ownerId: string, filters: PaginationQuery & { date?: string }) => {
  const course = await getOwnedCourseOrThrow(ownerId);
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(filters);

  const whereClause: Record<string, unknown> = { course: course._id };
  if (filters.date) {
    const day = new Date(filters.date);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    whereClause.date = { $gte: day, $lt: nextDay };
  }

  const [teeTimes, total] = await Promise.all([
    TeeTime.find(whereClause)
      .sort({ [sortBy === 'createdAt' ? 'date' : sortBy]: sortOrder === 'asc' ? 1 : -1, startTime: 1 })
      .skip(skip)
      .limit(limit),
    TeeTime.countDocuments(whereClause),
  ]);

  return { teeTimes, meta: buildMeta(page, limit, total) };
};

export const adminListAllTeeTimes = async (filters: PaginationQuery & { date?: string }) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(filters);

  const whereClause: Record<string, unknown> = {};
  if (filters.date) {
    const day = new Date(filters.date);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    whereClause.date = { $gte: day, $lt: nextDay };
  }

  const [teeTimes, total] = await Promise.all([
    TeeTime.find(whereClause)
      .sort({ [sortBy === 'createdAt' ? 'date' : sortBy]: sortOrder === 'asc' ? 1 : -1, startTime: 1 })
      .skip(skip)
      .limit(limit)
      .populate('course', 'name'),
    TeeTime.countDocuments(whereClause),
  ]);

  return { teeTimes, meta: buildMeta(page, limit, total) };
};

export const updateTeeTime = async (
  ownerId: string,
  teeTimeId: string,
  payload: Partial<Pick<ITeeTime, 'startTime' | 'endTime' | 'price' | 'capacity' | 'bookingType' | 'status'>>
): Promise<ITeeTime> => {
  const course = await getOwnedCourseOrThrow(ownerId);

  const teeTime = await TeeTime.findOne({ _id: teeTimeId, course: course._id });
  if (!teeTime) throw new AppError(404, 'Tee time not found');

  if (payload.startTime) teeTime.session = deriveSession(payload.startTime);
  Object.assign(teeTime, payload);
  await teeTime.save();

  return teeTime;
};

export const deleteTeeTime = async (ownerId: string, teeTimeId: string): Promise<void> => {
  const course = await getOwnedCourseOrThrow(ownerId);

  const teeTime = await TeeTime.findOne({ _id: teeTimeId, course: course._id });
  if (!teeTime) throw new AppError(404, 'Tee time not found');

  if (teeTime.bookedCount > 0) {
    throw new AppError(409, 'Cannot delete a tee time that already has bookings');
  }

  await teeTime.deleteOne();
};
