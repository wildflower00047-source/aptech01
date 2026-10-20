import env from '../config/env.js';
import tokenService from '../services/token.service.js';

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSecure ? 'none' : 'lax',
  domain: env.cookieDomain,
  path: '/',
});

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie('accessToken', accessToken, {
    ...baseCookieOptions(),
    maxAge: tokenService.parseTtl(env.accessTokenTtl),
  });
  res.cookie('refreshToken', refreshToken, {
    ...baseCookieOptions(),
    maxAge: tokenService.parseTtl(env.refreshTokenTtl),
  });
};

export const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', baseCookieOptions());
  res.clearCookie('refreshToken', baseCookieOptions());
};

export default { setAuthCookies, clearAuthCookies };
