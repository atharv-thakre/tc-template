import { Router, Request, Response } from 'express';

export const authRouter = Router();

// In-memory demo account database
let accounts = [
  {
    id: 1,
    uid: 'usr_001',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    handle: 'alex_dev',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 234-5678',
    role: 'user',
    status: 'active',
    has_password: true,
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    uid: 'usr_002',
    name: 'Sarah Connor',
    email: 'sarah@example.com',
    handle: 'sarah_c',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 987-6543',
    role: 'admin',
    status: 'active',
    has_password: true,
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper: create auth tokens
function createTokens(account: any) {
  const access_token = `app_jwt_${account.id}_${Date.now()}`;
  const refresh_token = `app_ref_${account.id}_${Date.now()}`;
  return {
    access_token,
    refresh_token,
    token_type: 'Bearer',
    account,
  };
}

// Helper: validate password
function validatePassword(password: string): { valid: boolean; message: string } {
  if (!password || password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true, message: 'Valid password' };
}

// POST /login/password & /login
authRouter.post(['/login/password', '/login/password/', '/login', '/login/'], (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/email and password are required' });
  }

  const target = String(identifier).toLowerCase();
  const account = accounts.find(
    (a) => a.email.toLowerCase() === target || a.handle.toLowerCase() === target
  );

  if (!account) {
    // Return first account for convenient demo fallback
    return res.json(createTokens(accounts[0]));
  }

  return res.json(createTokens(account));
});

// POST /signup/password & /signup
authRouter.post(['/signup/password', '/signup/password/', '/signup', '/signup/'], (req: Request, res: Response) => {
  const { name, email, handle, password } = req.body;

  if (password) {
    const check = validatePassword(password);
    if (!check.valid) {
      return res.status(400).json({ error: check.message });
    }
  }

  const newAccount = {
    id: accounts.length + 1,
    uid: `usr_${String(accounts.length + 1).padStart(3, '0')}`,
    name: name || 'New User',
    email: email || `user${accounts.length + 1}@example.com`,
    handle: handle || `user${accounts.length + 1}`,
    avatar_url: null,
    phone: null,
    role: 'user',
    status: 'active',
    has_password: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  accounts.push(newAccount);
  return res.json(createTokens(newAccount));
});

// GET /me
authRouter.get(['/me', '/me/'], (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let account = accounts[0];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const match = accounts.find((a) => token.includes(String(a.id)));
    if (match) account = match;
  }

  return res.json({
    account,
    session: {
      id: `sess_${account.id}`,
      account_id: account.id,
      ip_address: req.ip || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Browser Client',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    },
    payload: {
      sub: account.uid,
      role: account.role,
      status: account.status,
    },
  });
});

// PATCH /me
authRouter.patch(['/me', '/me/'], (req: Request, res: Response) => {
  const account = accounts[0];
  if (req.body.name !== undefined) account.name = req.body.name;
  if (req.body.email !== undefined) account.email = req.body.email;
  if (req.body.handle !== undefined) account.handle = req.body.handle;
  if (req.body.phone !== undefined) account.phone = req.body.phone;
  if (req.body.avatar_url !== undefined) account.avatar_url = req.body.avatar_url;
  account.updated_at = new Date().toISOString();

  return res.json(account);
});

// PUT /update/password
authRouter.put(['/update/password', '/update/password/'], (req: Request, res: Response) => {
  const { password } = req.body;
  if (password) {
    const check = validatePassword(password);
    if (!check.valid) {
      return res.status(400).json({ error: check.message });
    }
  }

  return res.json({
    success: true,
    message: 'Password updated successfully',
  });
});

// POST /token/refresh
authRouter.post(['/token/refresh', '/token/refresh/'], (_req: Request, res: Response) => {
  const newAccess = `app_jwt_refreshed_${Date.now()}`;
  const newRefresh = `app_ref_refreshed_${Date.now()}`;
  return res.json({
    access_token: newAccess,
    refresh_token: newRefresh,
    token_type: 'Bearer',
  });
});

// POST /logout
authRouter.post(['/logout', '/logout/'], (_req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// POST /logout-all
authRouter.post(['/logout-all', '/logout-all/'], (_req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'All sessions ended successfully',
  });
});
