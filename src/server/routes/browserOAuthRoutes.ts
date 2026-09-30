import { Router, Request, Response } from 'express';
import { accounts } from '../db';

export const browserOAuthRouter = Router();

const oauthStateStore = new Map<string, { frontend_url: string; provider: string }>();

const handleLogin = (provider: string) => (req: Request, res: Response) => {
  const frontendUrl = String(req.query.frontend_url || req.headers['origin'] || 'http://localhost:3000');
  const state = `state_${provider}_${Date.now()}`;
  oauthStateStore.set(state, { frontend_url: frontendUrl, provider });

  return res.redirect(307, `/${provider}/callback?code=mock_auth_code&state=${state}`);
};

const handleCallback = (provider: string) => (req: Request, res: Response) => {
  const state = String(req.query.state || '');
  let frontendUrl = 'http://localhost:3000';

  if (state && oauthStateStore.has(state)) {
    frontendUrl = oauthStateStore.get(state)!.frontend_url;
    oauthStateStore.delete(state);
  } else if (req.query.frontend_url) {
    frontendUrl = String(req.query.frontend_url);
  } else if (req.headers['origin']) {
    frontendUrl = String(req.headers['origin']);
  }

  const account = accounts[0];
  const access_token = `app_jwt_${account.id}_${Date.now()}`;
  const refresh_token = `app_ref_${account.id}_${Date.now()}`;

  const isLinking = req.query.linking === 'true' || req.query.action === 'link';
  if (isLinking) {
    return res.redirect(307, `${frontendUrl}/oauth/callback?linked=true&provider=${provider}`);
  }

  const useCookies = req.query.cookie === 'true' || process.env.AUTH_SEND_TOKENS_IN_COOKIE === 'True';
  if (useCookies) {
    res.cookie('access_token', access_token, { httpOnly: true, secure: true, sameSite: 'lax' });
    res.cookie('refresh_token', refresh_token, { httpOnly: true, secure: true, sameSite: 'lax' });
  }

  return res.redirect(307, `${frontendUrl}/oauth/callback?access_token=${access_token}&refresh_token=${refresh_token}`);
};

// Google
browserOAuthRouter.get(['/google/login', '/google/login/'], handleLogin('google'));
browserOAuthRouter.get(['/google/callback', '/google/callback/'], handleCallback('google'));

// GitHub
browserOAuthRouter.get(['/github/login', '/github/login/'], handleLogin('github'));
browserOAuthRouter.get(['/github/callback', '/github/callback/'], handleCallback('github'));

// Discord
browserOAuthRouter.get(['/discord/login', '/discord/login/'], handleLogin('discord'));
browserOAuthRouter.get(['/discord/callback', '/discord/callback/'], handleCallback('discord'));
