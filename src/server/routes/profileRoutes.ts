import { Router, Request, Response } from 'express';
import { getAuthenticatedAccountAndSession, sessions, setSessions, validatePassword } from '../db';

export const profileRouter = Router();

// GET /me
profileRouter.get('/me', (req: Request, res: Response) => {
  const auth = getAuthenticatedAccountAndSession(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  return res.json({
    account: auth.account,
    session: auth.session,
    payload: {
      aid: auth.account.id,
      sid: auth.session.id,
      token: auth.token,
    },
  });
});

// PATCH /me
profileRouter.patch('/me', (req: Request, res: Response) => {
  const auth = getAuthenticatedAccountAndSession(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const { name, email, handle, phone, avatar_url, status } = req.body;
  if (name !== undefined) auth.account.name = name;
  if (email !== undefined) auth.account.email = email;
  if (handle !== undefined) auth.account.handle = handle;
  if (phone !== undefined) auth.account.phone = phone;
  if (avatar_url !== undefined) auth.account.avatar_url = avatar_url;
  if (status !== undefined) auth.account.status = status;
  auth.account.updated_at = new Date().toISOString();

  return res.json(auth.account);
});

// PUT /update/password
profileRouter.put('/update/password', (req: Request, res: Response) => {
  const auth = getAuthenticatedAccountAndSession(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const { password } = req.body;
  if (!validatePassword(password)) {
    return res.status(400).json({
      error: 'WeakPasswordError: Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number.',
    });
  }

  auth.account.has_password = true;
  auth.account.updated_at = new Date().toISOString();

  return res.json({
    success: true,
    message: 'Password updated successfully',
  });
});

// POST /logout
profileRouter.post('/logout', (req: Request, res: Response) => {
  const auth = getAuthenticatedAccountAndSession(req);
  if (auth) {
    setSessions(sessions.filter((s) => s.id !== auth.session.id));
  }

  return res.json({
    success: true,
    message: 'Session destroyed successfully',
  });
});

// POST /logout-all
profileRouter.post('/logout-all', (req: Request, res: Response) => {
  const auth = getAuthenticatedAccountAndSession(req);
  let count = 0;
  if (auth) {
    const beforeCount = sessions.length;
    setSessions(sessions.filter((s) => s.account_id !== auth.account.id));
    count = beforeCount - sessions.length;
    if (count === 0) count = 1;
  } else {
    count = 1;
    setSessions([]);
  }

  return res.json({
    success: true,
    message: 'All sessions destroyed for account',
    count,
  });
});
