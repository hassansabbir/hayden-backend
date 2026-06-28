import { Document, Types } from 'mongoose';
import { MembershipTier } from '../users/user.constant';

export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface IMembership extends Document {
  user: Types.ObjectId;
  tier: MembershipTier;
  discountPercent: number;
  startDate: Date;
  expiresAt?: Date;
  status: MembershipStatus;
  createdAt: Date;
  updatedAt: Date;
}
