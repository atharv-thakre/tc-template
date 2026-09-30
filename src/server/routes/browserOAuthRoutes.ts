import { Router, Request, Response } from 'express';
import { accounts, oauthLinks, setOauthLinks } from '../db';

export const browserOAuthRouter = Router();

// Helper to decode session cookie
function getOAuthSession(req: Request): {
  frontend_url?: string;
  provider?: string;
  action?: string;
  link_account_id?: number | null;
  state?: string;
} | null {
  const cookieVal = (req as any).cookies?.session;
  if (!cookieVal) return null;
  try {
    const jsonStr = Buffer.from(cookieVal, 'base64').toString('utf-8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

const handleLogin = (provider: string) => (req: Request, res: Response) => {
  const frontendUrl = req.query.frontend_url;
  if (!frontendUrl) {
    return res.status(400).json({ error: 'frontend_url parameter is required' });
  }

  const action = req.query.action === 'link' || req.query.linking === 'true' ? 'link' : 'login';
  const state = String(req.query.state || `state_${provider}_${Date.now()}`);

  const sessionData = {
    frontend_url: String(frontendUrl),
    provider,
    action,
    link_account_id: req.query.account_id ? Number(req.query.account_id) : null,
    state,
  };

  // Set the session cookie to carry frontend_url and state across provider redirects
  res.cookie('session', Buffer.from(JSON.stringify(sessionData)).toString('base64'), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000,
  });

  // Redirect HTTP 307 to authorization screen/callback
  const prefix = req.baseUrl || '';
  return res.redirect(307, `${prefix}/${provider}/callback?code=mock_code_${provider}&state=${encodeURIComponent(state)}`);
};

const handleCallback = (provider: string) => (req: Request, res: Response) => {
  const sessionData = getOAuthSession(req);
  let frontendUrl = sessionData?.frontend_url;

  if (!frontendUrl) {
    if (req.query.frontend_url) {
      frontendUrl = String(req.query.frontend_url);
    } else if (req.headers['origin']) {
      frontendUrl = String(req.headers['origin']);
    } else {
      frontendUrl = 'http://localhost:3000';
    }
  }

  // Ensure clean frontend base URL without trailing slash
  frontendUrl = frontendUrl.replace(/\/+$/, '');

  const action = sessionData?.action || (req.query.linking === 'true' || req.query.action === 'link' ? 'link' : 'login');

  // Handle explicit error parameter
  if (req.query.error) {
    const errorMsg = String(req.query.error);
    if (action === 'link') {
      return res.redirect(307, `${frontendUrl}/${provider}/callback?linked=false&provider=${provider}&error=${encodeURIComponent(errorMsg)}`);
    }
    return res.redirect(307, `${frontendUrl}/${provider}/callback?error=${encodeURIComponent(errorMsg)}`);
  }

  // Account Linking Flow
  if (action === 'link') {
    const targetAccountId = sessionData?.link_account_id || 1;
    const existing = oauthLinks.find(
      (l) => l.account_id === targetAccountId && l.provider.toLowerCase() === provider.toLowerCase()
    );

    if (!existing) {
      const newLink = {
        id: oauthLinks.length + 1,
        account_id: targetAccountId,
        provider: provider.toLowerCase(),
        provider_user_id: `${provider}_user_${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setOauthLinks([...oauthLinks, newLink]);
    }

    return res.redirect(307, `${frontendUrl}/${provider}/callback?linked=true&provider=${provider}`);
  }

  // Login / Signup Flow
  const account = accounts[0];
  const access_token = `app_jwt_${account.id}_${Date.now()}`;
  const refresh_token = `app_ref_${account.id}_${Date.now()}`;

  const dualTokenMode = process.env.DUAL_TOKEN_MODE === 'True' || req.query.dual_token === 'true';
  const useCookies = req.query.cookie === 'true' || process.env.AUTH_SEND_TOKENS_IN_COOKIE === 'True';

  if (useCookies) {
    res.cookie('access_token', access_token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
    if (dualTokenMode) {
      res.cookie('refresh_token', refresh_token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
    }
  }

  if (dualTokenMode) {
    return res.redirect(307, `${frontendUrl}/${provider}/callback?access_token=${access_token}&refresh_token=${refresh_token}`);
  } else {
    return res.redirect(307, `${frontendUrl}/${provider}/callback?access_token=${access_token}`);
  }
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
