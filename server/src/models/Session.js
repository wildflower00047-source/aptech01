import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// A Session represents a single active device/login for a user.
// The refresh token is stored hashed; rotating the token updates this document.
const sessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    userAgent: { type: String, default: 'unknown' },
    ip: { type: String, default: 'unknown' },
    device: { type: String, default: 'unknown' },
    browser: { type: String, default: 'unknown' },
    os: { type: String, default: 'unknown' },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    revokedAt: Date,
    revokedReason: String,
    riskScore: { type: Number, default: 0 },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    riskFactors: { type: [Schema.Types.Mixed], default: [] },
    trusted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

sessionSchema.virtual('isActive').get(function isActive() {
  return !this.revokedAt && this.expiresAt > Date.now();
});

sessionSchema.index({ user: 1, revokedAt: 1 });

const Session = model('Session', sessionSchema);

export default Session;
