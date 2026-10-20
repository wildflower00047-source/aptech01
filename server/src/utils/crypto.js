import crypto from 'crypto';

export const generateRandomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const timingSafeEqual = (a = '', b = '') => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

export default { generateRandomToken, hashToken, timingSafeEqual };
