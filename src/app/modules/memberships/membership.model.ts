import { Schema, model } from 'mongoose';
import { IMembership } from './membership.interface';
import { MEMBERSHIP_TIER } from '../users/user.constant';

export const TIER_DISCOUNTS: Record<string, number> = {
  [MEMBERSHIP_TIER.STANDARD]: 0,
  [MEMBERSHIP_TIER.PREMIUM]: 10,
  [MEMBERSHIP_TIER.ELITE]: 20,
};

const membershipSchema = new Schema<IMembership>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    tier: { type: String, enum: Object.values(MEMBERSHIP_TIER), default: MEMBERSHIP_TIER.STANDARD },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    startDate: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

membershipSchema.pre('save', function (next) {
  if (this.isModified('tier')) {
    this.discountPercent = TIER_DISCOUNTS[this.tier] ?? 0;
  }
  next();
});

export const Membership = model<IMembership>('Membership', membershipSchema);
