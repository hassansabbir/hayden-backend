import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from './user.interface';
import { MEMBERSHIP_TIER, ROLE, ROLES } from './user.constant';
import { env } from '../../config/env';
import { softDeletePlugin } from '../../utils/softDeletePlugin';

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: ROLE.USER, required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course' },
    membershipTier: {
      type: String,
      enum: Object.values(MEMBERSHIP_TIER),
      default: MEMBERSHIP_TIER.STANDARD,
    },
    avatar: { type: Schema.Types.ObjectId, ref: 'Media' },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    mustResetPassword: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

userSchema.plugin(softDeletePlugin);

userSchema.index({ role: 1 });
userSchema.index({ fullName: 'text', email: 'text' });

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, env.BCRYPT_SALT_ROUNDS);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User = model<IUser>('User', userSchema);
