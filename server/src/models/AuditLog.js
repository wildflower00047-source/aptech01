import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const auditLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorEmail: String,
    action: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: ['auth', 'account', 'security', 'admin', 'system'],
      default: 'system',
    },
    status: { type: String, enum: ['success', 'failure'], default: 'success' },
    description: String,
    ip: String,
    userAgent: String,
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });

const AuditLog = model('AuditLog', auditLogSchema);

export default AuditLog;
