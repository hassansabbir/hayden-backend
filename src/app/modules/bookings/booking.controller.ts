import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import * as bookingService from './booking.service';

export const createBooking = catchAsync(async (req: Request, res: Response) => {
  const booking = await bookingService.createBooking(req.user?.userId, req.body);
  sendResponse(res, { statusCode: 201, message: 'Booking request submitted successfully', data: booking });
});

export const lookupBooking = catchAsync(async (req: Request, res: Response) => {
  const { email, bookingId } = req.query as { email: string; bookingId: string };
  const booking = await bookingService.lookupBooking(email, bookingId);
  sendResponse(res, { statusCode: 200, message: 'Booking retrieved successfully', data: booking });
});

export const listMyBookings = catchAsync(async (req: Request, res: Response) => {
  const { bookings, meta } = await bookingService.listMyBookings(req.user!.userId, req.query);
  sendResponse(res, { statusCode: 200, message: 'Bookings retrieved successfully', data: bookings, meta });
});

export const listBookingsForStaff = catchAsync(async (req: Request, res: Response) => {
  const { bookings, meta } = await bookingService.listBookingsForStaff(
    req.user!.userId,
    req.user!.role,
    req.query
  );
  sendResponse(res, { statusCode: 200, message: 'Requests retrieved successfully', data: bookings, meta });
});

export const confirmBooking = catchAsync(async (req: Request, res: Response) => {
  const booking = await bookingService.confirmBooking(req.user!.userId, req.params.id);
  sendResponse(res, { statusCode: 200, message: 'Booking confirmed successfully', data: booking });
});

export const declineBooking = catchAsync(async (req: Request, res: Response) => {
  const booking = await bookingService.declineBooking(req.user!.userId, req.params.id);
  sendResponse(res, { statusCode: 200, message: 'Booking declined successfully', data: booking });
});

export const cancelMyBooking = catchAsync(async (req: Request, res: Response) => {
  const booking = await bookingService.cancelMyBooking(req.user!.userId, req.params.id);
  sendResponse(res, { statusCode: 200, message: 'Booking cancelled successfully', data: booking });
});
