import { Document, Types } from 'mongoose';
import { BookingType, SessionType, TeeTimeStatus } from './teeTime.constant';

export interface ITeeTime extends Document {
  course: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  session: SessionType;
  bookingType: BookingType;
  price: number;
  capacity: number;
  bookedCount: number;
  status: TeeTimeStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
