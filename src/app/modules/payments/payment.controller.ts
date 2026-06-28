import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import * as paymentService from './payment.service';

export const recordPayment = catchAsync(async (req: Request, res: Response) => {
  const payment = await paymentService.recordPayment(req.params.bookingId, req.body.method);
  sendResponse(res, { statusCode: 201, message: 'Payment recorded successfully', data: payment });
});

export const getPaymentForBooking = catchAsync(async (req: Request, res: Response) => {
  const payment = await paymentService.getPaymentForBooking(req.params.bookingId);
  sendResponse(res, { statusCode: 200, message: 'Payment retrieved successfully', data: payment });
});
