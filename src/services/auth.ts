import {
  AuthResponse,
  LoginPasswordInput,
  RefreshTokenResponse,
  SignupPasswordInput,
  StandardActionResponse,
} from '../types';
import {
  apiClient,
  clearAllTokensAndCookies,
  DEFAULT_BASE_URL,
  getCustomBaseUrl,
  getStoredApiMode,
  LOCAL_STORAGE_REFRESH_TOKEN_KEY,
  LOCAL_STORAGE_TOKEN_KEY,
  tokenStorage,
} from './apiClient';
import { INITIAL_ACCOUNTS } from './mockData';

const DEMO_ACCOUNTS_KEY = 'app_auth_demo_accounts';

export function getDemoAccounts() {
  const data = localStorage.getItem(DEMO_ACCOUNTS_KEY);
  if (!data) {
    localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(INITIAL_ACCOUNTS));
    return INITIAL_ACCOUNTS;
  }
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(INITIAL_ACCOUNTS));
      return INITIAL_ACCOUNTS;
    }
    return parsed;
  } catch {
    localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(INITIAL_ACCOUNTS));
    return INITIAL_ACCOUNTS;
  }
}

export function saveDemoAccounts(accounts: any[]) {
  localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function createDemoTokenResponse(account: any): AuthResponse {
  const access_token = `app_jwt_${account.id}_${Date.now()}`;
  const refresh_token = `app_ref_${account.id}_${Date.now()}`;
  tokenStorage.setTokens(access_token, refresh_token);

  return {
    access_token,
    refresh_token,
    token_type: 'Bearer',
    account,
  };
}

function extractAuthResponse(resData: any): AuthResponse {
  const payload = resData?.data || resData || {};
  const access_token = payload.access_token || payload.token || payload.accessToken || payload.jwt || '';
  const refresh_token = payload.refresh_token || payload.refreshToken || undefined;
  const token_type = payload.token_type || payload.tokenType || 'Bearer';
  const account = payload.account || payload.user || payload.account_data || payload.data?.account || payload.data?.user || null;

  if (access_token) {
    tokenStorage.setTokens(access_token, refresh_token || null);
  }

  return {
    access_token,
    refresh_token,
    token_type,
    account: account || {
      id: 1,
      uid: 'usr_me',
      name: 'User',
      email: 'user@example.com',
      handle: 'user',
      role: 'user',
      status: 'active',
      created_at: new Date().toISOString(),
    },
  };
}

export const authService = {
  // POST /login/password
  async loginPassword(input: LoginPasswordInput): Promise<AuthResponse> {
    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const accounts = getDemoAccounts();
      const target = input.identifier.toLowerCase();
      let matched = accounts.find(
        (a: any) =>
          a.email?.toLowerCase() === target ||
          a.handle?.toLowerCase() === target
      );
      if (!matched) {
        matched = accounts[0];
      }
      return createDemoTokenResponse(matched);
    }

    const res = await apiClient.post('/login/password', {
      identifier: input.identifier,
      password: input.password,
    });
    return extractAuthResponse(res.data);
  },

  // POST /login/otp
  async loginOTP(input: { email: string; otp: string }): Promise<AuthResponse> {
    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const accounts = getDemoAccounts();
      const matched = accounts.find((a: any) => a.email?.toLowerCase() === input.email.toLowerCase()) || accounts[0];
      return createDemoTokenResponse(matched);
    }

    const res = await apiClient.post('/login/otp', {
      email: input.email,
      otp: input.otp,
    });
    return extractAuthResponse(res.data);
  },

  // POST /send/email/otp/{purpose}
  // Sends email containing both Magic Link button and 6-digit OTP code
  async sendEmailOTP(
    purpose: 'login' | 'signup' | 'reset' | 'verify' = 'login',
    input: { email: string; frontend_url?: string }
  ): Promise<{ expires_at: number }> {
    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { expires_at: Math.floor(Date.now() / 1000) + 600 };
    }

    const frontendUrl =
      input.frontend_url || (typeof window !== 'undefined' ? window.location.origin : undefined);
    const res = await apiClient.post(`/send/email/otp/${purpose}`, {
      email: input.email,
      frontend_url: frontendUrl,
    });
    return res.data;
  },

  // POST /signup/otp
  async signupOTP(input: { name: string; email: string; handle: string; password?: string; otp: string }): Promise<AuthResponse> {
    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const accounts = getDemoAccounts();
      const newAccount = {
        id: `usr_${Date.now()}`,
        uid: `usr_${Date.now()}`,
        name: input.name,
        email: input.email,
        handle: input.handle,
        role: 'user',
        status: 'active',
        has_password: Boolean(input.password),
        created_at: new Date().toISOString(),
      };
      accounts.push(newAccount);
      saveDemoAccounts(accounts);
      return createDemoTokenResponse(newAccount);
    }

    const res = await apiClient.post('/signup/otp', {
      name: input.name,
      email: input.email,
      handle: input.handle,
      password: input.password,
      otp: input.otp,
    });
    return extractAuthResponse(res.data);
  },

  // POST /signup/password
  async signupPassword(input: SignupPasswordInput): Promise<AuthResponse> {
    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const accounts = getDemoAccounts();
      const newAccount = {
        id: `usr_${Date.now()}`,
        uid: `usr_${Date.now()}`,
        name: input.name,
        email: input.email,
        handle: input.handle,
        role: 'user',
        status: 'active',
        has_password: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      accounts.push(newAccount);
      saveDemoAccounts(accounts);
      return createDemoTokenResponse(newAccount);
    }

    const res = await apiClient.post('/signup/password', {
      name: input.name,
      email: input.email,
      handle: input.handle,
      password: input.password,
    });
    return extractAuthResponse(res.data);
  },

  // POST /forgot/password
  async forgotPassword(input: { email: string; otp: string; password?: string }): Promise<AuthResponse> {
    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const accounts = getDemoAccounts();
      const matched = accounts.find((a: any) => a.email?.toLowerCase() === input.email.toLowerCase()) || accounts[0];
      return createDemoTokenResponse(matched);
    }

    const res = await apiClient.post('/forgot/password', {
      email: input.email,
      otp: input.otp,
      password: input.password,
    });
    return extractAuthResponse(res.data);
  },

  // POST /token/refresh
  async refreshToken(refreshTokenValue?: string): Promise<RefreshTokenResponse> {
    const currentRef = refreshTokenValue || tokenStorage.getRefreshToken();
    if (!currentRef) {
      throw new Error('No refresh token available');
    }

    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const newAccess = `app_jwt_refreshed_${Date.now()}`;
      const newRefresh = `app_ref_refreshed_${Date.now()}`;
      tokenStorage.setTokens(newAccess, newRefresh);
      return {
        access_token: newAccess,
        refresh_token: newRefresh,
        token_type: 'Bearer',
      };
    }

    const res = await apiClient.post('/token/refresh', {
      refresh_token: currentRef,
    });

    const payload = res.data?.data || res.data || {};
    const newAccess = payload.access_token || payload.token;
    const newRefresh = payload.refresh_token || currentRef;

    if (newAccess) {
      tokenStorage.setTokens(newAccess, newRefresh);
    }

    return {
      access_token: newAccess,
      refresh_token: newRefresh,
      token_type: payload.token_type || 'Bearer',
    };
  },

  // POST /link/{purpose} (Programmatic Bot-Safe Verification for SPAs)
  async verifyMagicLink(purpose: string, input: { email: string; otp: string }): Promise<AuthResponse> {
    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const accounts = getDemoAccounts();
      const matched = accounts.find((a: any) => a.email?.toLowerCase() === input.email.toLowerCase()) || accounts[0];
      return createDemoTokenResponse(matched);
    }

    const res = await apiClient.post(`/link/${purpose}`, {
      email: input.email,
      otp: input.otp,
    });
    return extractAuthResponse(res.data);
  },

  // POST /logout
  async logout(): Promise<StandardActionResponse> {
    try {
      await apiClient.post('/logout', {});
    } catch {
      // ignore
    } finally {
      clearAllTokensAndCookies();
    }
    return { success: true, message: 'Logged out successfully' };
  },

  // POST /logout-all
  async logoutAll(): Promise<StandardActionResponse> {
    try {
      await apiClient.post('/logout-all', {});
    } catch {
      // ignore
    } finally {
      clearAllTokensAndCookies();
    }
    return { success: true, message: 'All sessions ended successfully' };
  },

  // OAuth Login URL: ${serverUrl}/${provider}/login?frontend_url=${encodeURIComponent(frontendUrl)}
  getOAuthLoginUrl(provider: 'google' | 'github' | 'discord'): string {
    const rawBase = getCustomBaseUrl() || DEFAULT_BASE_URL || '';
    let serverUrl = rawBase.trim();
    if (serverUrl) {
      serverUrl = serverUrl.replace(/\/+$/, '');
    } else if (typeof window !== 'undefined' && window.location.origin) {
      serverUrl = window.location.origin;
    }
    const frontendUrl = (typeof window !== 'undefined' ? window.location.origin : '') || 'http://localhost:3000';
    return `${serverUrl}/${provider}/login?frontend_url=${encodeURIComponent(frontendUrl)}`;
  },
};
