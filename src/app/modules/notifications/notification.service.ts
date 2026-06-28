import { Notification } from './notification.model';
import { INotification, NotificationType } from './notification.interface';
import { calculatePagination, buildMeta, PaginationQuery } from '../../utils/paginationHelper';

export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string
): Promise<INotification> => {
  return Notification.create({ user: userId, type, title, message });
};

export const listMyNotifications = async (userId: string, filters: PaginationQuery) => {
  const { page, limit, skip } = calculatePagination(filters);

  const whereClause = { user: userId };
  const [notifications, total] = await Promise.all([
    Notification.find(whereClause).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(whereClause),
  ]);

  return { notifications, meta: buildMeta(page, limit, total) };
};

export const markNotificationRead = async (userId: string, notificationId: string): Promise<void> => {
  await Notification.updateOne({ _id: notificationId, user: userId }, { isRead: true });
};
