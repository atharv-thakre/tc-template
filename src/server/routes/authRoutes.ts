import { Router, Request, Response } from 'express';
import { accounts, otps, setOtps, validatePassword, Account } from '../db';

export const authRouterGroup = Router();

function createTokens(account: Account) {
  const access_token = `app_jwt_${account.id}_${Date.now()}`;
  const refresh_token = `app_ref_${account.id}_${Date.now()}`;
  return {
    access_token,
    refresh_token,
    token_type: 'Bearer',
    account,
  };
}

// 1. POST /send/email/otp/:purpose
authRouterGroup.post('/send/email/otp/:purpose', (req: Request, res: Response) => {
  const purpose = req.params.purpose || 'login';
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const otp = '123456';
  const expires_at = Math.floor(Date.now() / 1000) + 3600;

  const filtered = otps.filter((o) => !(o.email.toLowerCase() === email.toLowerCase() && o.purpose === purpose));
  setOtps([...filtered, { email: email.toLowerCase(), purpose, otp, expires_at }]);

  return res.json({ expires_at });
});

// 2. POST /send/email/link/:purpose
authRouterGroup.post('/send/email/link/:purpose', (req: Request, res: Response) => {
  const purpose = req.params.purpose || 'login';
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const otp = '123456';
  const expires_at = Math.floor(Date.now() / 1000) + 3600;

  const filtered = otps.filter((o) => !(o.email.toLowerCase() === email.toLowerCase() && o.purpose === purpose));
  setOtps([...filtered, { email: email.toLowerCase(), purpose, otp, expires_at }]);

  return res.json({ expires_at });
});

// 3. GET /link/:purpose
authRouterGroup.get('/link/:purpose', (req: Request, res: Response) => {
  const purpose = req.params.purpose || 'login';
  const email = String(req.query.email || '');
  const otp = String(req.query.otp || '123456');
  const frontendUrl = String(req.query.frontend_url || req.headers['origin'] || 'http://localhost:3000');

  if (!email || !otp) {
    return res.redirect(307, `${frontendUrl}/magic-link/callback?error=${encodeURIComponent('Missing email or OTP')}`);
  }

  const record = otps.find((o) => o.email.toLowerCase() === email.toLowerCase() && o.purpose === purpose && o.otp === otp);
  if (!record || record.expires_at < Math.floor(Date.now() / 1000)) {
    return res.redirect(307, `${frontendUrl}/magic-link/callback?error=${encodeURIComponent('Link expired, invalid, or already used')}`);
  }

  const account = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase()) || accounts[0];

  if (purpose === 'login') {
    setOtps(otps.filter((o) => o !== record));
    const tokens = createTokens(account);
    return res.redirect(307, `${frontendUrl}/oauth/callback?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`);
  }

  if (purpose === 'verify') {
    setOtps(otps.filter((o) => o !== record));
    account.status = 'active';
    return res.redirect(307, `${frontendUrl}/magic-link/callback?verified=true&email=${encodeURIComponent(email)}`);
  }

  if (purpose === 'reset') {
    return res.redirect(307, `${frontendUrl}/reset-password?email=${encodeURIComponent(email)}&otp=${otp}`);
  }

  if (purpose === 'signup') {
    return res.redirect(307, `${frontendUrl}/signup?email=${encodeURIComponent(email)}&otp=${otp}&verified=true`);
  }

  return res.redirect(307, `${frontendUrl}/magic-link/callback?error=${encodeURIComponent('Unknown purpose')}`);
});

// 4. POST /link/:purpose
authRouterGroup.post('/link/:purpose', (req: Request, res: Response) => {
  const purpose = req.params.purpose || 'login';
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const record = otps.find((o) => o.email.toLowerCase() === email.toLowerCase() && o.purpose === purpose && o.otp === otp);
  if (!record || record.expires_at < Math.floor(Date.now() / 1000)) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }

  const account = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase()) || accounts[0];

  if (purpose === 'login') {
    setOtps(otps.filter((o) => o !== record));
    return res.json(createTokens(account));
  }

  if (purpose === 'verify') {
    setOtps(otps.filter((o) => o !== record));
    account.status = 'active';
    return res.json({ success: true, message: 'Email verified successfully', email });
  }

  return res.json({ success: true, email, otp, purpose });
});

// 5. POST /signup/otp
authRouterGroup.post('/signup/otp', (req: Request, res: Response) => {
  const { name, email, password, otp, handle } = req.body;
  if (!email || !password || !otp) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      error: 'WeakPasswordError: Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number.',
    });
  }

  const record = otps.find((o) => o.email.toLowerCase() === email.toLowerCase() && o.purpose === 'signup' && o.otp === otp);
  if (!record) {
    return res.status(401).json({ error: 'Invalid or expired signup OTP' });
  }
  setOtps(otps.filter((o) => o !== record));

  let existing = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    existing.has_password = true;
    existing.status = 'active';
    return res.json(createTokens(existing));
  }

  const newAccount: Account = {
    id: accounts.length + 1,
    uid: `usr_${String(accounts.length + 1).padStart(3, '0')}`,
    name: name || 'New User',
    email,
    handle: handle || email.split('@')[0],
    phone: null,
    avatar_url: null,
    role: 'user',
    status: 'active',
    has_password: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  accounts.push(newAccount);
  return res.json(createTokens(newAccount));
});

// 6. POST /signup/password
authRouterGroup.post('/signup/password', (req: Request, res: Response) => {
  const { name, email, handle, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      error: 'WeakPasswordError: Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number.',
    });
  }

  let existing = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    existing.has_password = true;
    return res.json(createTokens(existing));
  }

  const newAccount: Account = {
    id: accounts.length + 1,
    uid: `usr_${String(accounts.length + 1).padStart(3, '0')}`,
    name: name || 'New User',
    email,
    handle: handle || email.split('@')[0],
    phone: null,
    avatar_url: null,
    role: 'user',
    status: 'active',
    has_password: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  accounts.push(newAccount);
  return res.json(createTokens(newAccount));
});

// 7. POST /login/otp
authRouterGroup.post('/login/otp', (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const record = otps.find((o) => o.email.toLowerCase() === email.toLowerCase() && o.purpose === 'login' && o.otp === otp);
  if (!record) {
    return res.status(401).json({ error: 'Invalid or expired login OTP' });
  }
  setOtps(otps.filter((o) => o !== record));

  const account = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase()) || accounts[0];
  return res.json(createTokens(account));
});

// 8. POST /login/password
authRouterGroup.post('/login/password', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Username/email is required' });
  }

  const target = String(identifier).toLowerCase();
  const account = accounts.find(
    (a) => a.email.toLowerCase() === target || a.handle.toLowerCase() === target
  );

  if (!account) {
    return res.status(404).json({ error: 'Account does not exist' });
  }

  return res.json(createTokens(account));
});

// 9. POST /forgot/password
authRouterGroup.post('/forgot/password', (req: Request, res: Response) => {
  const { email, otp, password } = req.body;
  if (!email || !otp || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      error: 'WeakPasswordError: Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number.',
    });
  }

  const record = otps.find((o) => o.email.toLowerCase() === email.toLowerCase() && o.purpose === 'reset' && o.otp === otp);
  if (!record) {
    return res.status(401).json({ error: 'Invalid or expired reset OTP' });
  }
  setOtps(otps.filter((o) => o !== record));

  const account = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase()) || accounts[0];
  account.has_password = true;
  account.updated_at = new Date().toISOString();

  return res.json(createTokens(account));
});

// 10. POST /token/refresh
authRouterGroup.post('/token/refresh', (_req: Request, res: Response) => {
  const newAccess = `app_jwt_refreshed_${Date.now()}`;
  const newRefresh = `app_ref_refreshed_${Date.now()}`;
  return res.json({
    access_token: newAccess,
    refresh_token: newRefresh,
    token_type: 'Bearer',
  });
});
