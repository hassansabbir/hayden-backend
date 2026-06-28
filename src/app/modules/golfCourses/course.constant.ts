export const COURSE_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type CourseStatus = (typeof COURSE_STATUS)[keyof typeof COURSE_STATUS];

export const COURSE_STATUSES = Object.values(COURSE_STATUS);

export const HOLES_OPTIONS = [9, 18] as const;
