import { AuditLog } from './auditLog.model';

export const recordAuditLog = async (
  actorId: string,
  action: string,
  targetModel: string,
  targetId: string,
  metadata?: Record<string, unknown>
): Promise<void> => {
  await AuditLog.create({ actor: actorId, action, targetModel, targetId, metadata });
};

export const listAuditLogsForTarget = async (targetModel: string, targetId: string) => {
  return AuditLog.find({ targetModel, targetId }).sort({ createdAt: -1 }).populate('actor', 'fullName email');
};
