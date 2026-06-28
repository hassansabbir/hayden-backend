import { Document, Types } from 'mongoose';
import { BookingStatus } from './booking.constant';

export interface IBookingContact {
  fullName: string;
  email: string;
  phone: string;
}

export interface IBookingPricing {
  teeTimePrice: number;
  bookingFee: number;
  taxes: number;
  total: number;
}

export interface IBooking extends Document {
  bookingId: string;
  course: Types.ObjectId;
  teeTime: Types.ObjectId;
  user?: Types.ObjectId;
  contact: IBookingContact;
  holesPreference: '9' | '18';
  players: number;
  specialRequests?: string;
  agreedToTerms: boolean;
  status: BookingStatus;
  decidedBy?: Types.ObjectId;
  decidedAt?: Date;
  pricing: IBookingPricing;
  createdAt: Date;
  updatedAt: Date;
}
