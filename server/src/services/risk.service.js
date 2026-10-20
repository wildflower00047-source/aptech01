import Session from '../models/Session.js';
import AuditLog from '../models/AuditLog.js';

// Heuristic risk assessment for a login attempt. Scores 0-100 based on device
// novelty, IP novelty, recent failed attempts and unusual sign-in hours.
export const assessLoginRisk = async (user, req) => {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const factors = [];
  let score = 0;

  const [knownDevice, knownIp, recentFailed] = await Promise.all([
    Session.exists({ user: user._id, userAgent }),
    Session.exists({ user: user._id, ip }),
    AuditLog.countDocuments({
      user: user._id,
      action: 'user.login',
      status: 'failure',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }),
  ]);

  if (!knownDevice) {
    score += 35;
    factors.push({ key: 'new_device', label: 'Unrecognized device', weight: 35 });
  }
  if (!knownIp) {
    score += 25;
    factors.push({ key: 'new_ip', label: 'New network / IP address', weight: 25 });
  }
  if (recentFailed > 0) {
    const weight = Math.min(25, recentFailed * 5);
    score += weight;
    factors.push({ key: 'failed_attempts', label: `${recentFailed} failed attempt(s) in 24h`, weight });
  }
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) {
    score += 10;
    factors.push({ key: 'odd_hour', label: 'Unusual sign-in hour', weight: 10 });
  }

  score = Math.min(100, score);
  const level = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';

  return { score, level, factors, ip, userAgent, recentFailed };
};

export default { assessLoginRisk };
