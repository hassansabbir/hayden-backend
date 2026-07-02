import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { AppError } from '../../errors/AppError';
import { env } from '../../config/env';
import * as authService from './auth.service';
import { parseDurationMs } from './auth.service';
import { CLIENT_APP_HEADER, getClientApp, getRefreshTokenCookieName } from './auth.constant';

const getCookieOptions = (req: Request) => {
  const isSecure =
    env.NODE_ENV === 'production' ||
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https';
  const options: any = {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax' as const,
    signed: true,
    maxAge: parseDurationMs(env.JWT_REFRESH_EXPIRES_IN),
  };
  if (env.COOKIE_DOMAIN) {
    options.domain = env.COOKIE_DOMAIN;
  }
  return options;
};

const requestMeta = (req: Request) => ({
  userAgent: req.headers['user-agent'],
  ip: req.ip,
});

const refreshCookieName = (req: Request) => getRefreshTokenCookieName(getClientApp(req.headers[CLIENT_APP_HEADER]));

const setRefreshCookie = (req: Request, res: Response, token: string) => {
  res.cookie(refreshCookieName(req), token, getCookieOptions(req));
};

export const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.register(req.body, requestMeta(req));
  setRefreshCookie(req, res, result.tokens.refreshToken);
  sendResponse(res, {
    statusCode: 201,
    message: 'Account created successfully',
    data: { accessToken: result.tokens.accessToken, user: result.user },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password, requestMeta(req));
  setRefreshCookie(req, res, result.tokens.refreshToken);
  sendResponse(res, {
    statusCode: 200,
    message: 'Logged in successfully',
    data: { accessToken: result.tokens.accessToken, user: result.user },
  });
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.signedCookies?.[refreshCookieName(req)];
  if (!token) throw new AppError(401, 'No active session found');

  const tokens = await authService.refreshAccessToken(token, requestMeta(req));
  setRefreshCookie(req, res, tokens.refreshToken);
  sendResponse(res, {
    statusCode: 200,
    message: 'Access token refreshed',
    data: { accessToken: tokens.accessToken },
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const cookieName = refreshCookieName(req);
  const token = req.signedCookies?.[cookieName];
  if (token) await authService.logout(token);
  res.clearCookie(cookieName, getCookieOptions(req));
  sendResponse(res, { statusCode: 200, message: 'Logged out successfully', data: null });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  sendResponse(res, {
    statusCode: 200,
    message: 'If an account exists for this email, an OTP has been sent',
    data: null,
  });
});

export const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const resetTicket = await authService.verifyOtp(req.body.email, req.body.otp);
  sendResponse(res, { statusCode: 200, message: 'OTP verified successfully', data: { resetTicket } });
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.resetTicket, req.body.password);
  sendResponse(res, { statusCode: 200, message: 'Password reset successfully', data: null });
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  await authService.changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
  sendResponse(res, { statusCode: 200, message: 'Password changed successfully', data: null });
});

export const listSessions = catchAsync(async (req: Request, res: Response) => {
  const sessions = await authService.listSessions(req.user!.userId);
  sendResponse(res, { statusCode: 200, message: 'Sessions retrieved successfully', data: sessions });
});

export const revokeSession = catchAsync(async (req: Request, res: Response) => {
  await authService.revokeSession(req.user!.userId, req.params.id);
  sendResponse(res, { statusCode: 200, message: 'Session revoked successfully', data: null });
});
