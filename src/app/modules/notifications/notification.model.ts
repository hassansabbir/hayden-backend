import { Schema, model } from 'mongoose';
import { INotification } from './notification.interface';

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['BOOKING_CONFIRMED', 'BOOKING_DECLINED', 'CLUB_APPROVED', 'PASSWORD_RESET', 'OTP_ISSUED'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: { type: String, enum: ['IN_APP', 'EMAIL'], default: 'IN_APP' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
