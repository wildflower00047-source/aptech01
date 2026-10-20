import { hashToken, generateRandomToken } from '../utils/crypto.js';

const baseTemplate = ({ title, intro, body, ctaText, ctaUrl, footer }) => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#0b1120;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#111827;border:1px solid #1f2937;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);">
                <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:.5px;">AuthSec</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 36px;color:#e5e7eb;">
                <h2 style="margin:0 0 12px;font-size:18px;color:#f9fafb;">${title}</h2>
                <p style="margin:0 0 20px;line-height:1.6;color:#9ca3af;">${intro}</p>
                ${body || ''}
                ${
                  ctaUrl
                    ? `<a href="${ctaUrl}" style="display:inline-block;margin:8px 0 4px;padding:12px 22px;background:#6366f1;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">${ctaText}</a>
                       <p style="margin:16px 0 0;font-size:12px;color:#6b7280;word-break:break-all;">Or paste this link: ${ctaUrl}</p>`
                    : ''
                }
              </td>
            </tr>
            <tr>
              <td style="padding:18px 36px;background:#0b1120;color:#6b7280;font-size:12px;">${footer || 'You received this email from AuthSec. If this wasn&rsquo;t you, you can ignore it.'}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

// In development (no SMTP host) emails are logged to the console.
const sendMail = async ({ to, subject, html, text }) => {
  const { env } = await import('../config/env.js');
  const logger = (await import('../utils/logger.js')).default;

  if (!env.email.host) {
    logger.warn('===== EMAIL (dev console transport) =====');
    logger.info(`To: ${to}`);
    logger.info(`Subject: ${subject}`);
    console.log(text || html);
    logger.warn('=========================================');
    return { messageId: 'dev-console', preview: text || html };
  }

  const nodemailer = (await import('nodemailer')).default;
  const transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.secure,
    auth: env.email.user ? { user: env.email.user, pass: env.email.pass } : undefined,
  });

  return transporter.sendMail({ from: env.email.from, to, subject, html, text });
};

export const sendVerificationEmail = async (user, rawToken) => {
  const { env } = await import('../config/env.js');
  const url = `${env.clientUrl}/verify-email?token=${rawToken}`;
  const html = baseTemplate({
    title: 'Verify your email',
    intro: `Hi ${user.name}, welcome to AuthSec. Please confirm your email address to activate your account.`,
    ctaText: 'Verify email',
    ctaUrl: url,
    footer: 'This verification link expires in 24 hours.',
  });
  return sendMail({
    to: user.email,
    subject: 'Verify your AuthSec email',
    html,
    text: `Verify your email: ${url}`,
  });
};

export const sendPasswordResetEmail = async (user, rawToken) => {
  const { env } = await import('../config/env.js');
  const url = `${env.clientUrl}/reset-password?token=${rawToken}`;
  const html = baseTemplate({
    title: 'Reset your password',
    intro: `Hi ${user.name}, we received a request to reset your password. This link is valid for 1 hour.`,
    ctaText: 'Reset password',
    ctaUrl: url,
    footer: 'If you did not request this, you can safely ignore this email.',
  });
  return sendMail({
    to: user.email,
    subject: 'Reset your AuthSec password',
    html,
    text: `Reset your password: ${url}`,
  });
};

export const sendWelcomeEmail = async (user) => {
  const html = baseTemplate({
    title: 'Your account is ready 🎉',
    intro: `Welcome aboard, ${user.name}! Your AuthSec account is fully set up with role: ${user.role}.`,
    ctaText: 'Go to dashboard',
    ctaUrl: `${(await import('../config/env.js')).env.clientUrl}/dashboard`,
  });
  return sendMail({ to: user.email, subject: 'Welcome to AuthSec', html });
};

export const sendLoginAlertEmail = async (user, meta = {}) => {
  const body = `<p style="color:#9ca3af;font-size:14px;">Device: ${meta.device || 'Unknown'}<br/>IP: ${meta.ip || 'Unknown'}<br/>Time: ${new Date().toLocaleString()}</p>`;
  const html = baseTemplate({
    title: 'New sign-in detected',
    intro: `Hi ${user.name}, we noticed a new sign-in to your account.`,
    body,
    footer: 'If this was not you, please reset your password immediately.',
  });
  return sendMail({ to: user.email, subject: 'New sign-in to your AuthSec account', html });
};

export const hashResetToken = hashToken;
export const makeToken = generateRandomToken;

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendLoginAlertEmail,
  hashResetToken,
  makeToken,
};
