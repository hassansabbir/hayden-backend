import { Document, Types } from 'mongoose';

export type PaymentMethod = 'GUEST_CHECKOUT' | 'CARD' | 'MEMBERSHIP_CREDIT';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';

export interface IPayment extends Document {
  booking: Types.ObjectId;
  amount: number;
  currency: string;
  method: PaymentMethod;
  provider: string;
  transactionId?: string;
  status: PaymentStatus;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
