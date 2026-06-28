import { Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  actor: Types.ObjectId;
  action: string;
  targetModel: string;
  targetId: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
