export interface Account {
  id: number;
  uid: string;
  name: string;
  handle: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  status: string;
  has_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  account_id: number;
  token_hash: string;
  ip_address: string;
  user_agent: string;
  expires_at: string;
  created_at: string;
}

export interface OAuthLink {
  id: number;
  account_id: number;
  provider: string;
  provider_user_id: string;
  created_at: string;
}

export interface OtpRecord {
  email: string;
  purpose: string;
  otp: string;
  expires_at: number;
}

export let accounts: Account[] = [
  {
    id: 1,
    uid: '2d7b5f8e-8d8a-4cc4-9c3d-2f2c6c4d2e28',
    name: 'Jane Doe',
    handle: 'jane',
    email: 'jane@example.com',
    phone: null,
    avatar_url: null,
    role: 'user',
    status: 'active',
    has_password: true,
    created_at: '2026-08-07T12:00:00',
    updated_at: '2026-08-07T12:00:00',
  },
  {
    id: 2,
    uid: 'usr_002',
    name: 'Sarah Connor',
    handle: 'sarah_c',
    email: 'sarah@example.com',
    phone: '+1 (555) 987-6543',
    avatar_url: null,
    role: 'admin',
    status: 'active',
    has_password: true,
    created_at: '2026-08-07T12:00:00',
    updated_at: '2026-08-07T12:00:00',
  },
];

export let sessions: Session[] = [
  {
    id: 9,
    account_id: 1,
    token_hash: 'mock_token_hash_1',
    ip_address: '203.0.113.10',
    user_agent: 'Mozilla/5.0',
    expires_at: '2026-08-08T12:00:00',
    created_at: '2026-08-07T12:00:00',
  },
];

export let oauthLinks: OAuthLink[] = [
  {
    id: 1,
    account_id: 1,
    provider: 'google',
    provider_user_id: '1049281048',
    created_at: '2026-09-12T12:00:00',
  },
];

export let otps: OtpRecord[] = [
  {
    email: 'jane@example.com',
    purpose: 'login',
    otp: '123456',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  },
  {
    email: 'jane@example.com',
    purpose: 'verify',
    otp: '123456',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  },
  {
    email: 'jane@example.com',
    purpose: 'signup',
    otp: '123456',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  },
  {
    email: 'jane@example.com',
    purpose: 'reset',
    otp: '123456',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  },
];

export function setSessions(newSessions: Session[]) {
  sessions = newSessions;
}

export function setOauthLinks(newLinks: OAuthLink[]) {
  oauthLinks = newLinks;
}

export function setOtps(newOtps: OtpRecord[]) {
  otps = newOtps;
}

export function validatePassword(password: string): boolean {
  if (!password || password.length < 6) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasUppercase && hasLowercase && hasNumber;
}

export function getAuthenticatedAccountAndSession(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  let account = accounts[0];
  const matchId = token.match(/_(\d+)_/);
  if (matchId && matchId[1]) {
    const found = accounts.find((a) => a.id === Number(matchId[1]));
    if (found) account = found;
  }

  const session = sessions.find((s) => s.account_id === account.id) || sessions[0] || {
    id: 9,
    account_id: account.id,
    token_hash: 'mock_token_hash',
    ip_address: req.ip || '203.0.113.10',
    user_agent: req.headers['user-agent'] || 'Mozilla/5.0',
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
  };

  return { account, session, token };
}
