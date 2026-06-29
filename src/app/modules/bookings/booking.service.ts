import mongoose from 'mongoose';
import { Booking } from './booking.model';
import { IBooking } from './booking.interface';
import { TeeTime } from '../teeTimes/teeTime.model';
import { Course } from '../golfCourses/course.model';
import { AppError } from '../../errors/AppError';
import { generateBookingId } from '../../utils/generateBookingId';
import { calculatePagination, buildMeta, PaginationQuery } from '../../utils/paginationHelper';
import { BOOKING_FEE, BOOKING_STATUS, TAX_RATE } from './booking.constant';
import { ROLE } from '../users/user.constant';
import { createNotification } from '../notifications/notification.service';

interface CreateBookingInput {
  teeTimeId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  holesPreference: '9' | '18';
  players: number;
  specialRequests?: string;
  agreeToTerms: boolean;
}

export const createBooking = async (
  userId: string | undefined,
  payload: CreateBookingInput
): Promise<IBooking> => {
  const session = await mongoose.startSession();
  try {
    let booking: IBooking;

    await session.withTransaction(async () => {
      // Atomic capacity guard: only succeeds if there's still room, so two
      // concurrent requests can never both push bookedCount past capacity.
      const teeTime = await TeeTime.findOneAndUpdate(
        {
          _id: payload.teeTimeId,
          status: 'ACTIVE',
          $expr: { $lte: [{ $add: ['$bookedCount', payload.players] }, '$capacity'] },
        },
        { $inc: { bookedCount: payload.players } },
        { new: true, session }
      );

      if (!teeTime) {
        throw new AppError(409, 'Not enough slots remain for this tee time');
      }

      const taxes = Number((teeTime.price * TAX_RATE).toFixed(2));
      const total = Number((teeTime.price + BOOKING_FEE + taxes).toFixed(2));

      let bookingId = generateBookingId();
      // Practically never collides, but guard against the theoretical race anyway.
      while (await Booking.exists({ bookingId }).session(session)) {
        bookingId = generateBookingId();
      }

      const [created] = await Booking.create(
        [
          {
            bookingId,
            course: teeTime.course,
            teeTime: teeTime._id,
            user: userId,
            contact: { fullName: payload.fullName, email: payload.email, phone: payload.phoneNumber },
            holesPreference: payload.holesPreference,
            players: payload.players,
            specialRequests: payload.specialRequests,
            agreedToTerms: payload.agreeToTerms,
            pricing: { teeTimePrice: teeTime.price, bookingFee: BOOKING_FEE, taxes, total },
          },
        ],
        { session }
      );

      booking = created;
    });

    return booking!;
  } finally {
    await session.endSession();
  }
};

export const lookupBooking = async (email: string, bookingId: string): Promise<IBooking> => {
  const booking = await Booking.findOne({ bookingId, 'contact.email': email.toLowerCase() })
    .populate('course', 'name location heroImage')
    .populate('teeTime');

  if (!booking) throw new AppError(404, 'No booking found for that email and booking ID');
  return booking;
};

export const listMyBookings = async (userId: string, filters: PaginationQuery & { status?: string }) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(filters);

  const whereClause: Record<string, unknown> = { user: userId };
  if (filters.status) whereClause.status = filters.status;

  const [bookings, total] = await Promise.all([
    Booking.find(whereClause)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .populate('course', 'name heroImage')
      .populate('teeTime'),
    Booking.countDocuments(whereClause),
  ]);

  return { bookings, meta: buildMeta(page, limit, total) };
};

// Backs Requests.tsx — club owners see only their course's requests, admins
// (read-only) see every course's requests.
export const listBookingsForStaff = async (
  userId: string,
  role: string,
  filters: PaginationQuery & { status?: string }
) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(filters);

  const whereClause: Record<string, unknown> = {};
  if (filters.status) whereClause.status = filters.status;

  if (role === ROLE.COURSE_MANAGER) {
    const course = await Course.findOne({ owner: userId });
    if (!course) throw new AppError(404, 'No course is associated with this account');
    whereClause.course = course._id;
  }

  const [bookings, total] = await Promise.all([
    Booking.find(whereClause)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .populate('course', 'name')
      .populate('teeTime'),
    Booking.countDocuments(whereClause),
  ]);

  return { bookings, meta: buildMeta(page, limit, total) };
};

const getOwnedBookingOrThrow = async (ownerId: string, bookingId: string): Promise<IBooking> => {
  const course = await Course.findOne({ owner: ownerId });
  if (!course) throw new AppError(404, 'No course is associated with this account');

  const booking = await Booking.findOne({ _id: bookingId, course: course._id });
  if (!booking) throw new AppError(404, 'Booking not found');

  if (booking.status !== BOOKING_STATUS.PENDING) {
    throw new AppError(409, `This booking has already been ${booking.status.toLowerCase()}`);
  }

  return booking;
};

export const confirmBooking = async (ownerId: string, bookingId: string): Promise<IBooking> => {
  const booking = await getOwnedBookingOrThrow(ownerId, bookingId);
  booking.status = BOOKING_STATUS.CONFIRMED;
  booking.decidedBy = ownerId as unknown as mongoose.Types.ObjectId;
  booking.decidedAt = new Date();
  await booking.save();

  if (booking.user) {
    await createNotification(
      String(booking.user),
      'BOOKING_CONFIRMED',
      'Your booking is confirmed',
      `Booking ${booking.bookingId} has been confirmed.`
    );
  }

  return booking;
};

export const declineBooking = async (ownerId: string, bookingId: string): Promise<IBooking> => {
  const booking = await getOwnedBookingOrThrow(ownerId, bookingId);

  // Release the slots this booking was holding.
  await TeeTime.updateOne({ _id: booking.teeTime }, { $inc: { bookedCount: -booking.players } });

  booking.status = BOOKING_STATUS.DECLINED;
  booking.decidedBy = ownerId as unknown as mongoose.Types.ObjectId;
  booking.decidedAt = new Date();
  await booking.save();

  if (booking.user) {
    await createNotification(
      String(booking.user),
      'BOOKING_DECLINED',
      'Your booking was declined',
      `Booking ${booking.bookingId} was declined by the club.`
    );
  }

  return booking;
};

export const cancelMyBooking = async (userId: string, bookingId: string): Promise<IBooking> => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId });
  if (!booking) throw new AppError(404, 'Booking not found');

  if (booking.status === BOOKING_STATUS.CANCELLED) {
    throw new AppError(409, 'This booking is already cancelled');
  }

  if (booking.status === BOOKING_STATUS.PENDING || booking.status === BOOKING_STATUS.CONFIRMED) {
    await TeeTime.updateOne({ _id: booking.teeTime }, { $inc: { bookedCount: -booking.players } });
  }

  booking.status = BOOKING_STATUS.CANCELLED;
  await booking.save();
  return booking;
};
