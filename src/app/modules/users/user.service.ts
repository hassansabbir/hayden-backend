import { User } from './user.model';
import { IUser } from './user.interface';
import { AppError } from '../../errors/AppError';
import { calculatePagination, buildMeta, PaginationQuery } from '../../utils/paginationHelper';
import { recordAuditLog } from '../auditLogs/auditLog.service';

export const getMe = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');
  return user;
};

export const updateMe = async (
  userId: string,
  payload: Partial<Pick<IUser, 'fullName' | 'phone'>>
): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(userId, payload, { new: true, runValidators: true });
  if (!user) throw new AppError(404, 'User not found');
  return user;
};

interface GetUsersFilters extends PaginationQuery {
  search?: string;
  role?: string;
}

export const getAllUsers = async (filters: GetUsersFilters) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(filters);

  const conditions: Record<string, unknown>[] = [];
  if (filters.search) {
    conditions.push({ $text: { $search: filters.search } });
  }
  if (filters.role) {
    conditions.push({ role: filters.role });
  }

  const whereClause = conditions.length ? { $and: conditions } : {};

  const [users, total] = await Promise.all([
    User.find(whereClause)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(whereClause),
  ]);

  return { users, meta: buildMeta(page, limit, total) };
};

export const updateUserStatus = async (
  actorId: string,
  userId: string,
  isActive: boolean
): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true });
  if (!user) throw new AppError(404, 'User not found');

  await recordAuditLog(actorId, isActive ? 'USER_REACTIVATED' : 'USER_SUSPENDED', 'User', userId);

  return user;
};
