export const ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  COURSE_MANAGER: 'COURSE_MANAGER',
  STAFF: 'STAFF',
  USER: 'USER',
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

export const ROLES = Object.values(ROLE);

export const MEMBERSHIP_TIER = {
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM',
  ELITE: 'ELITE',
} as const;

export type MembershipTier = (typeof MEMBERSHIP_TIER)[keyof typeof MEMBERSHIP_TIER];
