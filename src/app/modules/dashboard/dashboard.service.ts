import { Booking } from '../bookings/booking.model';
import { TeeTime } from '../teeTimes/teeTime.model';
import { Course } from '../golfCourses/course.model';
import { AppError } from '../../errors/AppError';
import { ROLE } from '../users/user.constant';

const resolveCourseScope = async (userId: string, role: string): Promise<Record<string, unknown>> => {
  if (role === ROLE.COURSE_MANAGER) {
    const course = await Course.findOne({ owner: userId });
    if (!course) throw new AppError(404, 'No course is associated with this account');
    return { course: course._id };
  }
  // ADMIN/SUPER_ADMIN see every course.
  return {};
};

// Backs GeneralState.tsx
export const getStats = async (userId: string, role: string) => {
  const scope = await resolveCourseScope(userId, role);

  const [total, pending, confirmed, declined] = await Promise.all([
    Booking.countDocuments(scope),
    Booking.countDocuments({ ...scope, status: 'PENDING' }),
    Booking.countDocuments({ ...scope, status: 'CONFIRMED' }),
    Booking.countDocuments({ ...scope, status: 'DECLINED' }),
  ]);

  return { total, pending, confirmed, declined };
};

// Backs RequestOverview.tsx — last 7 days of request volume + how many of
// that day's requests are already confirmed.
export const getRequestsOverview = async (userId: string, role: string) => {
  const scope = await resolveCourseScope(userId, role);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const rows = await Booking.aggregate([
    { $match: { ...scope, createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        requests: { $sum: 1 },
        confirmed: { $sum: { $cond: [{ $eq: ['$status', 'CONFIRMED'] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return rows.map((row) => ({ name: row._id, requests: row.requests, confirmed: row.confirmed }));
};

// Backs BookingStatusChart.tsx
export const getBookingStatusBreakdown = async (userId: string, role: string) => {
  const { pending, confirmed, declined } = await getStats(userId, role);
  return [
    { name: 'Confirmed', value: confirmed },
    { name: 'Pending', value: pending },
    { name: 'Declined', value: declined },
  ];
};

// Backs TeeTimeUtilization.tsx — booked vs available slots per day for the
// next 7 days.
export const getTeeTimeUtilization = async (userId: string, role: string) => {
  const scope = await resolveCourseScope(userId, role);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAhead = new Date(today);
  sevenDaysAhead.setDate(today.getDate() + 7);

  const rows = await TeeTime.aggregate([
    { $match: { ...scope, date: { $gte: today, $lt: sevenDaysAhead } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        booked: { $sum: '$bookedCount' },
        capacity: { $sum: '$capacity' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return rows.map((row) => ({
    name: row._id,
    booked: row.booked,
    available: Math.max(row.capacity - row.booked, 0),
  }));
};
