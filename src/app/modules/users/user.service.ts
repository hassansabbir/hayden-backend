import { User } from './user.model';
import { IUser } from './user.interface';
import { AppError } from '../../errors/AppError';
import { calculatePagination, buildMeta, PaginationQuery } from '../../utils/paginationHelper';
import { recordAuditLog } from '../auditLogs/auditLog.service';
import { Media } from '../media/media.model';
import { deleteMedia } from '../media/media.service';

export const getMe = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId).populate('avatar', 'url');
  if (!user) throw new AppError(404, 'User not found');
  return user;
};

export const updateMe = async (
  userId: string,
  payload: Partial<Pick<IUser, 'fullName' | 'phone'>> & { avatar?: string | null }
): Promise<IUser> => {
  const existing = await User.findById(userId).select('avatar');
  if (!existing) throw new AppError(404, 'User not found');

  if (payload.avatar) {
    // The client only sends a media id — verify it's actually an avatar this
    // user uploaded, otherwise they could point their profile at someone
    // else's media (or a club image) just by guessing/enumerating ids.
    const media = await Media.findById(payload.avatar);
    if (!media || media.type !== 'USER_AVATAR' || String(media.uploadedBy) !== userId) {
      throw new AppError(400, 'Invalid avatar reference');
    }
  }

  const previousAvatarId = existing.avatar ? String(existing.avatar) : null;

  const user = await User.findByIdAndUpdate(userId, payload, { new: true, runValidators: true }).populate(
    'avatar',
    'url'
  );
  if (!user) throw new AppError(404, 'User not found');

  // Replacing/removing a photo orphans the previous upload — clean it up so
  // the uploads directory doesn't accumulate files nobody references anymore.
  if (payload.avatar !== undefined && previousAvatarId && previousAvatarId !== String(payload.avatar)) {
    await deleteMedia(previousAvatarId).catch(() => {});
  }

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
