import { Schema, model } from 'mongoose';
import { ITeeTime } from './teeTime.interface';
import { BOOKING_TYPE, BOOKING_TYPES, SESSIONS, TEE_TIME_STATUS, TEE_TIME_STATUSES } from './teeTime.constant';

const teeTimeSchema = new Schema<ITeeTime>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):([0-5]\d)$/ },
    endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):([0-5]\d)$/ },
    session: { type: String, enum: SESSIONS, required: true },
    bookingType: { type: String, enum: BOOKING_TYPES, default: BOOKING_TYPE.INSTANT },
    price: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1, max: 4 },
    bookedCount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: TEE_TIME_STATUSES, default: TEE_TIME_STATUS.ACTIVE },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

teeTimeSchema.index({ course: 1, date: 1, startTime: 1 }, { unique: true });
teeTimeSchema.index({ course: 1, date: 1 });
teeTimeSchema.index({ date: 1, session: 1 });

teeTimeSchema.path('bookedCount').validate(function (this: ITeeTime, value: number) {
  return value <= this.capacity;
}, 'bookedCount cannot exceed capacity');

export const TeeTime = model<ITeeTime>('TeeTime', teeTimeSchema);
