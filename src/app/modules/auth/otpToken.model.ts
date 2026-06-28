import { Document, Schema, model } from 'mongoose';

export type OtpPurpose = 'PASSWORD_RESET' | 'EMAIL_VERIFICATION';

export interface IOtpToken extends Document {
  email: string;
  otpHash: string;
  purpose: OtpPurpose;
  attempts: number;
  expiresAt: Date;
  consumed: boolean;
  createdAt: Date;
}

const otpTokenSchema = new Schema<IOtpToken>({
  email: { type: String, required: true, lowercase: true, trim: true },
  otpHash: { type: String, required: true },
  purpose: { type: String, enum: ['PASSWORD_RESET', 'EMAIL_VERIFICATION'], required: true },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  consumed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

otpTokenSchema.index({ email: 1, purpose: 1 });
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpToken = model<IOtpToken>('OtpToken', otpTokenSchema);
