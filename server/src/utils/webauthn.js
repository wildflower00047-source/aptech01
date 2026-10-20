export const toB64url = (buf) => Buffer.from(buf).toString('base64url');

export const fromB64url = (str) => new Uint8Array(Buffer.from(str, 'base64url'));

export const userIdBytes = (id) => new Uint8Array(Buffer.from(String(id), 'utf8'));

export default { toB64url, fromB64url, userIdBytes };
