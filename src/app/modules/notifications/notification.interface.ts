import { Document, Types } from 'mongoose';

export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_DECLINED'
  | 'CLUB_APPROVED'
  | 'PASSWORD_RESET'
  | 'OTP_ISSUED';

export type NotificationChannel = 'IN_APP' | 'EMAIL';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  channel: NotificationChannel;
  isRead: boolean;
  createdAt: Date;
}
