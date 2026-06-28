export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  DECLINED: 'DECLINED',
  CANCELLED: 'CANCELLED',
} as const;

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];
export const BOOKING_STATUSES = Object.values(BOOKING_STATUS);

export const HOLES_PREFERENCE = ['9', '18'] as const;

export const BOOKING_FEE = 9.95;
export const TAX_RATE = 0.08;
