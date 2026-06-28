import { Schema, model } from 'mongoose';
import { IBooking } from './booking.interface';
import { BOOKING_STATUS, BOOKING_STATUSES, HOLES_PREFERENCE } from './booking.constant';

const contactSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const pricingSchema = new Schema(
  {
    teeTimePrice: { type: Number, required: true, min: 0 },
    bookingFee: { type: Number, required: true, min: 0 },
    taxes: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const bookingSchema = new Schema<IBooking>(
  {
    bookingId: { type: String, required: true, unique: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    teeTime: { type: Schema.Types.ObjectId, ref: 'TeeTime', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    contact: { type: contactSchema, required: true },
    holesPreference: { type: String, enum: HOLES_PREFERENCE, required: true },
    players: { type: Number, required: true, min: 1, max: 4 },
    specialRequests: { type: String, maxlength: 500 },
    agreedToTerms: { type: Boolean, required: true },
    status: { type: String, enum: BOOKING_STATUSES, default: BOOKING_STATUS.PENDING },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    decidedAt: { type: Date },
    pricing: { type: pricingSchema, required: true },
  },
  { timestamps: true }
);

bookingSchema.index({ 'contact.email': 1, bookingId: 1 });
bookingSchema.index({ course: 1, status: 1 });
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ teeTime: 1 });

export const Booking = model<IBooking>('Booking', bookingSchema);
