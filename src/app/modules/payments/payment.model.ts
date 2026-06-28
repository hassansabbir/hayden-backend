import { Schema, model } from 'mongoose';
import { IPayment } from './payment.interface';

const paymentSchema = new Schema<IPayment>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    method: { type: String, enum: ['GUEST_CHECKOUT', 'CARD', 'MEMBERSHIP_CREDIT'], required: true },
    provider: { type: String, default: 'manual' },
    transactionId: { type: String, unique: true, sparse: true },
    status: { type: String, enum: ['PENDING', 'PAID', 'REFUNDED', 'FAILED'], default: 'PENDING' },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export const Payment = model<IPayment>('Payment', paymentSchema);
