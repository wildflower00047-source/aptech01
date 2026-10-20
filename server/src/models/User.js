import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import env from '../config/env.js';
import { ROLES, permissionsForRole } from '../utils/roles.js';
import { generateRandomToken, hashToken } from '../utils/crypto.js';

const { Schema, model } = mongoose;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be at most 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, 'Please provide a valid email'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: [280, 'Bio must be at most 280 characters'],
    },

    // ---- Email verification ----
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },

    // ---- Password reset ----
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: { type: Date, select: false },

    // ---- 2FA ----
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorRecoveryCodes: { type: [String], select: false },
    recoveryCodesCreatedAt: { type: Date, select: false },

    // ---- Passkeys / WebAuthn ----
    webauthnCredentials: { type: [Schema.Types.Mixed], default: [], select: false },
    webauthnChallenge: { type: String, select: false },
    webauthnChallengeExpires: { type: Date, select: false },

    // ---- Security / lockout ----
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    lastLoginAt: Date,
    lastLoginIp: String,
    lastLoginDevice: String,
    loginAlertsEnabled: { type: Boolean, default: true },
    lastRiskScore: { type: Number, default: 0 },

    // ---- Password history (hashes) ----
    passwordHistory: { type: [String], default: [], select: false },

    // ---- Gamification ----
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: { type: [String], default: [] },
    completedTasks: { type: [String], default: [] },

    // ---- Status ----
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    bannedReason: String,

    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      emailNotifications: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.twoFactorSecret;
        delete ret.twoFactorRecoveryCodes;
        delete ret.recoveryCodesCreatedAt;
        delete ret.passwordHistory;
        delete ret.webauthnCredentials;
        delete ret.webauthnChallenge;
        delete ret.webauthnChallengeExpires;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

userSchema.virtual('initials').get(function initials() {
  return this.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
});

userSchema.virtual('isLocked').get(function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, env.bcryptSaltRounds);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Returns true if the candidate matches the current password or any recent one.
userSchema.methods.isPasswordReused = async function isPasswordReused(candidate) {
  const history = this.passwordHistory || [];
  const toCheck = [this.password, ...history].filter(Boolean);
  const results = await Promise.all(toCheck.map((hash) => bcrypt.compare(candidate, hash).catch(() => false)));
  return results.some(Boolean);
};

// Pushes the current (old) password hash into history, capped at 5 entries.
userSchema.methods.pushPasswordHistory = function pushPasswordHistory() {
  if (!this.password) return;
  const history = new Set(this.passwordHistory || []);
  history.add(this.password);
  this.passwordHistory = [...history].slice(-5);
};

userSchema.methods.permissions = function permissions() {
  return permissionsForRole(this.role);
};

userSchema.methods.hasPermission = function hasPermission(permission) {
  return permissionsForRole(this.role).includes(permission);
};

userSchema.methods.createEmailVerificationToken = function createEmailVerificationToken() {
  const raw = generateRandomToken();
  this.emailVerificationToken = hashToken(raw);
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return raw;
};

userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const raw = generateRandomToken();
  this.passwordResetToken = hashToken(raw);
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  return raw;
};

userSchema.methods.registerFailedLogin = async function registerFailedLogin() {
  this.loginAttempts += 1;
  if (this.loginAttempts >= env.maxLoginAttempts) {
    this.lockUntil = new Date(Date.now() + env.lockTimeMs);
    this.loginAttempts = 0;
  }
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.resetLoginAttempts = async function resetLoginAttempts(ip) {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLoginAt = new Date();
  this.lastLoginIp = ip;
  await this.save({ validateBeforeSave: false });
};

userSchema.statics.findByEmail = function findByEmail(email, withSecret = false) {
  const query = this.findOne({ email: email.toLowerCase().trim() });
  if (withSecret)
    query.select('+password +loginAttempts +lockUntil +twoFactorSecret +twoFactorRecoveryCodes +passwordHistory');
  return query;
};

const User = model('User', userSchema);

export default User;
