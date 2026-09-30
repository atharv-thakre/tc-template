import {
  AuthResponse,
  LoginPasswordInput,
  RefreshTokenResponse,
  SignupPasswordInput,
  StandardActionResponse,
} from '../types';
import {
  clearAllTokensAndCookies,
  getStoredApiMode,
  LOCAL_STORAGE_REFRESH_TOKEN_KEY,
  LOCAL_STORAGE_TOKEN_KEY,
  requestWithFallback,
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
  localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, access_token);
  localStorage.setItem(LOCAL_STORAGE_REFRESH_TOKEN_KEY, refresh_token);

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
    localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, access_token);
  }
  if (refresh_token) {
    localStorage.setItem(LOCAL_STORAGE_REFRESH_TOKEN_KEY, refresh_token);
  }

  return {
    access_token,
    refresh_token,
    token_type,
    account: account || {
      id: 'usr_me',
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
  // Login with Email or Handle and Password
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

    try {
      const res = await requestWithFallback<any>('post', [
        '/login/password',
        '/login/password/',
        '/login',
        '/login/',
      ], {
        identifier: input.identifier,
        password: input.password,
      });
      return extractAuthResponse(res);
    } catch (err: any) {
      // In development or if server is offline, fallback to demo mode
      console.warn('Backend login endpoint unavailable, falling back to demo mode', err);
      const accounts = getDemoAccounts();
      return createDemoTokenResponse(accounts[0]);
    }
  },

  // Signup with Name, Email, Handle, Password
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

    try {
      const res = await requestWithFallback<any>('post', [
        '/signup/password',
        '/signup/password/',
        '/signup',
        '/signup/',
      ], input);
      return extractAuthResponse(res);
    } catch (err: any) {
      console.warn('Backend signup endpoint unavailable, creating local demo account', err);
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
      };
      accounts.push(newAccount);
      saveDemoAccounts(accounts);
      return createDemoTokenResponse(newAccount);
    }
  },

  // Refresh Token
  async refreshToken(refreshTokenValue?: string): Promise<RefreshTokenResponse> {
    const currentRef = refreshTokenValue || localStorage.getItem(LOCAL_STORAGE_REFRESH_TOKEN_KEY);
    if (!currentRef) {
      throw new Error('No refresh token available');
    }

    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const newAccess = `app_jwt_refreshed_${Date.now()}`;
      const newRefresh = `app_ref_refreshed_${Date.now()}`;
      localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, newAccess);
      localStorage.setItem(LOCAL_STORAGE_REFRESH_TOKEN_KEY, newRefresh);
      return {
        access_token: newAccess,
        refresh_token: newRefresh,
        token_type: 'Bearer',
      };
    }

    const res = await requestWithFallback<any>('post', [
      '/token/refresh',
      '/token/refresh/',
      '/auth/refresh',
    ], {
      refresh_token: currentRef,
    });

    const payload = res?.data || res || {};
    const newAccess = payload.access_token || payload.token || `app_jwt_refreshed_${Date.now()}`;
    const newRefresh = payload.refresh_token || currentRef;

    localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, newAccess);
    if (newRefresh) {
      localStorage.setItem(LOCAL_STORAGE_REFRESH_TOKEN_KEY, newRefresh);
    }

    return {
      access_token: newAccess,
      refresh_token: newRefresh,
      token_type: payload.token_type || 'Bearer',
    };
  },

  // Logout Current Session
  async logout(): Promise<StandardActionResponse> {
    try {
      await requestWithFallback('post', ['/logout', '/logout/'], {});
    } catch {
      // ignore
    } finally {
      clearAllTokensAndCookies();
    }
    return { success: true, message: 'Logged out successfully' };
  },

  // Logout All Sessions
  async logoutAll(): Promise<StandardActionResponse> {
    try {
      await requestWithFallback('post', ['/logout-all', '/logout-all/', '/session/all'], {});
    } catch {
      // ignore
    } finally {
      clearAllTokensAndCookies();
    }
    return { success: true, message: 'All sessions ended successfully' };
  },

  // Send Email OTP / Magic Link
  async sendEmailOTP(
    purpose: 'login' | 'signup' | 'reset' | 'verify' = 'login',
    input: { email: string; frontend_url?: string }
  ) {
    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { expires_at: Date.now() + 600000 };
    }

    const frontendUrl =
      input.frontend_url || (typeof window !== 'undefined' ? window.location.origin : undefined);
    return await requestWithFallback<any>('post', [
      `/send/email/otp/${purpose}`,
      `/send/email/otp/${purpose}/`,
      `/otp/send/${purpose}`,
      `/send-email-otp/${purpose}`,
    ], {
      email: input.email,
      frontend_url: frontendUrl,
    });
  },

  // Login with OTP
  async loginOTP(input: { email: string; otp: string }): Promise<AuthResponse> {
    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const accounts = getDemoAccounts();
      const matched = accounts.find((a: any) => a.email?.toLowerCase() === input.email.toLowerCase()) || accounts[0];
      return createDemoTokenResponse(matched);
    }

    const res = await requestWithFallback<any>('post', [
      '/login/otp',
      '/login/otp/',
      '/auth/login/otp',
    ], input);
    return extractAuthResponse(res);
  },

  // Verify Magic Link
  async verifyMagicLink(purpose: string, input: { email: string; otp: string }): Promise<AuthResponse> {
    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const accounts = getDemoAccounts();
      const matched = accounts.find((a: any) => a.email?.toLowerCase() === input.email.toLowerCase()) || accounts[0];
      return createDemoTokenResponse(matched);
    }

    const res = await requestWithFallback<any>('post', [
      `/verify/magic-link/${purpose}`,
      `/verify/magic-link/${purpose}/`,
      '/verify/magic-link',
      '/auth/verify-magic-link',
    ], input);
    return extractAuthResponse(res);
  },

  // Signup with OTP
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

    const res = await requestWithFallback<any>('post', [
      '/signup/otp',
      '/signup/otp/',
      '/auth/signup/otp',
    ], input);
    return extractAuthResponse(res);
  },

  // Forgot Password / Reset Password
  async forgotPassword(input: { email: string; otp: string; password?: string }): Promise<AuthResponse> {
    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const accounts = getDemoAccounts();
      const matched = accounts.find((a: any) => a.email?.toLowerCase() === input.email.toLowerCase()) || accounts[0];
      return createDemoTokenResponse(matched);
    }

    const res = await requestWithFallback<any>('post', [
      '/forgot-password',
      '/forgot-password/',
      '/password/reset',
      '/auth/forgot-password',
    ], input);
    return extractAuthResponse(res);
  },

  // Get OAuth Login URL
  getOAuthLoginUrl(provider: 'google' | 'github' | 'discord'): string {
    const baseUrl = (typeof window !== 'undefined' ? window.location.origin : '') || '';
    return `/auth/${provider}?redirect_url=${encodeURIComponent(baseUrl + '/profile')}`;
  },
};
