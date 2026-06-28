import { Document, Types } from 'mongoose';
import { MembershipTier, Role } from './user.constant';

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: Role;
  course?: Types.ObjectId;
  membershipTier: MembershipTier;
  avatar?: Types.ObjectId;
  isEmailVerified: boolean;
  isActive: boolean;
  mustResetPassword: boolean;
  lastLoginAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedBy?: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}
