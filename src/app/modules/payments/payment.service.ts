import crypto from 'crypto';
import { Payment } from './payment.model';
import { IPayment, PaymentMethod } from './payment.interface';
import { Booking } from '../bookings/booking.model';
import { AppError } from '../../errors/AppError';

// No real payment provider is wired up yet (see ARCHITECTURE.md §8.4-equivalent
// note). This records a payment as immediately PAID, which is accurate for
// today's "Paid via Guest Checkout" flow and is the seam where a real Stripe
// (or similar) integration would plug in — swap the body of this function,
// the schema/route layer stays the same.
export const recordPayment = async (bookingId: string, method: PaymentMethod): Promise<IPayment> => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError(404, 'Booking not found');

  const existing = await Payment.findOne({ booking: bookingId });
  if (existing) throw new AppError(409, 'This booking has already been paid for');

  return Payment.create({
    booking: bookingId,
    amount: booking.pricing.total,
    method,
    provider: 'manual',
    transactionId: crypto.randomUUID(),
    status: 'PAID',
    paidAt: new Date(),
  });
};

export const getPaymentForBooking = async (bookingId: string): Promise<IPayment> => {
  const payment = await Payment.findOne({ booking: bookingId });
  if (!payment) throw new AppError(404, 'No payment found for this booking');
  return payment;
};
