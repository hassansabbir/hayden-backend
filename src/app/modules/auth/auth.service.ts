import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../users/user.model';
import { IUser } from '../users/user.interface';
import { ROLE } from '../users/user.constant';
import { RefreshToken } from './refreshToken.model';
import { OtpToken } from './otpToken.model';
import { AppError } from '../../errors/AppError';
import { env } from '../../config/env';
import { signToken, verifyToken } from '../../utils/jwtHelpers';
import { compareOtp, generateOtp, hashOtp } from '../../utils/otpHelpers';
import { logger } from '../../config/logger';
import { ILoginResult, IResetTicketPayload } from './auth.interface';
import { RESET_TICKET_EXPIRES_IN } from './auth.constant';
import { createNotification } from '../notifications/notification.service';
import { sendMail } from '../../utils/mailer';
import { renderOtpEmail } from '../../utils/emailTemplates';

const hashRefreshToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

interface RequestMeta {
  userAgent?: string;
  ip?: string;
}

const issueTokens = async (user: IUser, meta: RequestMeta) => {
  const accessToken = signToken(
    { userId: user.id, role: user.role, mustResetPassword: user.mustResetPassword },
    env.JWT_ACCESS_SECRET,
    env.JWT_ACCESS_EXPIRES_IN
  );

  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN));

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashRefreshToken(rawRefreshToken),
    userAgent: meta.userAgent,
    ip: meta.ip,
    expiresAt,
  });

  return { accessToken, refreshToken: rawRefreshToken };
};

// Minimal "30d" / "15m" style duration parser — avoids pulling in a whole
// date-math dependency for one conversion.
export const parseDurationMs = (duration: string): number => {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 30 * 24 * 60 * 60 * 1000;

  const value = Number(match[1]);
  const unit = match[2];
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 86_400_000;
  return value * unitMs;
};

export const register = async (payload: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}, meta: RequestMeta): Promise<ILoginResult> => {
  const existing = await User.findOne({ email: payload.email.toLowerCase() });
  if (existing) throw new AppError(409, 'An account with this email already exists');

  const user = await User.create({
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    passwordHash: payload.password,
    role: ROLE.USER,
  });

  const tokens = await issueTokens(user, meta);

  return {
    tokens,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      mustResetPassword: user.mustResetPassword,
    },
  };
};

export const login = async (
  email: string,
  password: string,
  meta: RequestMeta
): Promise<ILoginResult> => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) throw new AppError(401, 'Invalid email or password');

  if (!user.isActive) throw new AppError(403, 'This account has been suspended');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError(401, 'Invalid email or password');

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueTokens(user, meta);

  return {
    tokens,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      mustResetPassword: user.mustResetPassword,
    },
  };
};

export const refreshAccessToken = async (rawRefreshToken: string, meta: RequestMeta) => {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const stored = await RefreshToken.findOne({ tokenHash, revoked: false });

  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, 'Session expired, please log in again');
  }

  const user = await User.findById(stored.user);
  if (!user || !user.isActive) {
    throw new AppError(401, 'Session expired, please log in again');
  }

  // Rotate: revoke the used refresh token and issue a brand-new pair.
  stored.revoked = true;
  await stored.save();

  const tokens = await issueTokens(user, meta);
  return tokens;
};

export const logout = async (rawRefreshToken: string): Promise<void> => {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  await RefreshToken.updateOne({ tokenHash }, { revoked: true });
};

export const listSessions = async (userId: string) => {
  return RefreshToken.find({ user: userId, revoked: false }).sort({ createdAt: -1 });
};

export const revokeSession = async (userId: string, sessionId: string): Promise<void> => {
  const result = await RefreshToken.updateOne(
    { _id: sessionId, user: userId },
    { revoked: true }
  );
  if (result.matchedCount === 0) throw new AppError(404, 'Session not found');
};

export const forgotPassword = async (email: string): Promise<void> => {
  const user = await User.findOne({ email: email.toLowerCase() });
  // Don't reveal whether the email exists — respond the same way either way.
  if (!user) return;

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRES_IN_MINUTES * 60 * 1000);

  await OtpToken.create({ email: user.email, otpHash, purpose: 'PASSWORD_RESET', expiresAt });

  // Send the OTP to the user's inbox (best-effort — non-fatal if SMTP fails;
  // the OTP is also logged below so the flow stays testable without SMTP).
  try {
    await sendMail({
      to: user.email,
      subject: 'Your Tee It Up password reset code',
      html: renderOtpEmail({
        fullName: user.fullName,
        otp,
        expiresInMinutes: env.OTP_EXPIRES_IN_MINUTES,
      }),
    });
  } catch (err) {
    logger.error('Failed to send OTP email', { err, to: user.email });
  }

  // Keep the log for local dev / SMTP-less environments.
  logger.info(`OTP for ${user.email}: ${otp}`);

  await createNotification(
    user.id,
    'OTP_ISSUED',
    'Password reset code',
    `Your verification code is ${otp}. It expires in ${env.OTP_EXPIRES_IN_MINUTES} minutes.`
  );
};

export const verifyOtp = async (email: string, otp: string): Promise<string> => {
  const record = await OtpToken.findOne({
    email: email.toLowerCase(),
    purpose: 'PASSWORD_RESET',
    consumed: false,
  }).sort({ createdAt: -1 });

  if (!record || record.expiresAt < new Date()) {
    throw new AppError(400, 'OTP has expired, please request a new one');
  }

  if (record.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw new AppError(429, 'Too many incorrect attempts, please request a new OTP');
  }

  const isMatch = await compareOtp(otp, record.otpHash);
  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    throw new AppError(400, 'Invalid OTP');
  }

  record.consumed = true;
  await record.save();

  const payload: IResetTicketPayload = { email: record.email, purpose: 'PASSWORD_RESET' };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: RESET_TICKET_EXPIRES_IN });
};

export const resetPassword = async (resetTicket: string, password: string): Promise<void> => {
  let payload: IResetTicketPayload;
  try {
    payload = jwt.verify(resetTicket, env.JWT_ACCESS_SECRET) as IResetTicketPayload;
  } catch {
    throw new AppError(401, 'Reset session expired, please verify your OTP again');
  }

  if (payload.purpose !== 'PASSWORD_RESET') {
    throw new AppError(401, 'Invalid reset session');
  }

  const user = await User.findOne({ email: payload.email });
  if (!user) throw new AppError(404, 'User not found');

  user.passwordHash = password;
  user.mustResetPassword = false;
  await user.save();

  // Invalidate every existing session — a password reset should log the user out everywhere.
  await RefreshToken.updateMany({ user: user._id }, { revoked: true });

  await createNotification(
    user.id,
    'PASSWORD_RESET',
    'Password changed',
    'Your password was just reset. If this wasn\'t you, contact support immediately.'
  );
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw new AppError(404, 'User not found');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError(401, 'Current password is incorrect');

  user.passwordHash = newPassword;
  user.mustResetPassword = false;
  await user.save();
};

export const verifyAccessToken = (token: string) => verifyToken(token, env.JWT_ACCESS_SECRET);
