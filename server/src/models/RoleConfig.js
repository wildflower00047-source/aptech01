import mongoose from 'mongoose';
import { ROLES } from '../utils/roles.js';

const { Schema, model } = mongoose;

// Stores per-role permission overrides so admins can edit the RBAC matrix at runtime.
const roleConfigSchema = new Schema(
  {
    role: { type: String, enum: Object.values(ROLES), required: true, unique: true, index: true },
    permissions: { type: [String], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const RoleConfig = model('RoleConfig', roleConfigSchema);

export default RoleConfig;
