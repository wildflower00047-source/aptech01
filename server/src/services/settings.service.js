import SystemSetting from '../models/SystemSetting.js';
import logger from '../utils/logger.js';

const KEY = 'global';

export const DEFAULT_SETTINGS = Object.freeze({
  registrationOpen: true,
  requireEmailVerification: false,
  require2FAForAdmins: false,
  anomalyHighRiskRequires2FA: true,
  banAfterMaxAttempts: true,
  sessionIdleTimeoutMinutes: 0, // 0 = disabled
  maintenanceMode: false,
  threatFeedSize: 25,
});

let cache = { ...DEFAULT_SETTINGS };

export const loadSettings = async () => {
  try {
    const doc = await SystemSetting.findOne({ key: KEY }).lean();
    cache = { ...DEFAULT_SETTINGS, ...(doc?.value || {}) };
  } catch (error) {
    logger.warn(`Settings not loaded: ${error.message}`);
    cache = { ...DEFAULT_SETTINGS };
  }
  return cache;
};

export const getSettings = () => ({ ...cache });

export const updateSettings = async (patch, actorId) => {
  const clean = {};
  Object.keys(DEFAULT_SETTINGS).forEach((k) => {
    if (patch[k] !== undefined) clean[k] = patch[k];
  });
  const doc = await SystemSetting.findOneAndUpdate(
    { key: KEY },
    { key: KEY, value: { ...cache, ...clean }, updatedBy: actorId },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  cache = { ...DEFAULT_SETTINGS, ...(doc.value || {}) };
  return { ...cache };
};

export default { loadSettings, getSettings, updateSettings, DEFAULT_SETTINGS };
