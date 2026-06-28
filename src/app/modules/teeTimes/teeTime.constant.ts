export const SESSION = {
  EARLY_MORNING: 'EARLY_MORNING',
  MIDDAY: 'MIDDAY',
  AFTERNOON: 'AFTERNOON',
  TWILIGHT: 'TWILIGHT',
} as const;

export type SessionType = (typeof SESSION)[keyof typeof SESSION];
export const SESSIONS = Object.values(SESSION);

export const BOOKING_TYPE = {
  INSTANT: 'INSTANT',
  SHARED_CART: 'SHARED_CART',
  MEMBER_ONLY: 'MEMBER_ONLY',
} as const;

export type BookingType = (typeof BOOKING_TYPE)[keyof typeof BOOKING_TYPE];
export const BOOKING_TYPES = Object.values(BOOKING_TYPE);

export const TEE_TIME_STATUS = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
} as const;

export type TeeTimeStatus = (typeof TEE_TIME_STATUS)[keyof typeof TEE_TIME_STATUS];
export const TEE_TIME_STATUSES = Object.values(TEE_TIME_STATUS);
