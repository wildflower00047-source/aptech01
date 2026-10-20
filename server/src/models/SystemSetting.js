import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// A tiny single-document settings store (key/value) used for system-wide policy.
const systemSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, default: {} },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const SystemSetting = model('SystemSetting', systemSettingSchema);

export default SystemSetting;
