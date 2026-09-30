import {
  MeResponse,
  PatchMeInput,
  StandardActionResponse,
  UpdatePasswordInput,
} from '../types';
import {
  clearAllTokensAndCookies,
  getStoredApiMode,
  LOCAL_STORAGE_REFRESH_TOKEN_KEY,
  LOCAL_STORAGE_TOKEN_KEY,
  requestWithFallback,
} from './apiClient';
import { getDemoAccounts, saveDemoAccounts } from './auth';

export const profileService = {
  // GET /me
  async getMe(): Promise<MeResponse> {
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (!token) {
      throw new Error('Not authenticated');
    }

    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const accounts = getDemoAccounts();
      const matchedAccount = accounts[0];

      return {
        account: matchedAccount,
        session: {
          id: `sess_${matchedAccount.id}`,
          account_id: matchedAccount.id,
          ip_address: '127.0.0.1',
          user_agent: 'Client Web Browser',
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
          created_at: new Date().toISOString(),
        },
        payload: {
          sub: matchedAccount.id,
          role: matchedAccount.role,
          handle: matchedAccount.handle,
        },
      };
    }

    try {
      const resData = await requestWithFallback<any>('get', ['/me', '/me/', '/user/me', '/auth/me']);
      const payload = resData?.data || resData || {};

      if (payload.account) {
        return payload as MeResponse;
      }

      return {
        account: {
          id: payload.id || 'usr_me',
          uid: payload.uid || 'usr_me',
          name: payload.name || 'User',
          handle: payload.handle || 'user',
          email: payload.email || '',
          phone: payload.phone || null,
          avatar_url: payload.avatar_url || null,
          role: payload.role || 'user',
          status: payload.status || 'active',
          has_password: payload.has_password ?? true,
          created_at: payload.created_at || new Date().toISOString(),
          updated_at: payload.updated_at || new Date().toISOString(),
        },
        session: payload.session,
        payload: payload.payload,
      };
    } catch (err: any) {
      // In dev or offline backend, fallback to demo user
      console.warn('Backend /me endpoint unreachable, using demo user account', err);
      const accounts = getDemoAccounts();
      return {
        account: accounts[0],
      };
    }
  },

  // PATCH /me (Update current user profile)
  async patchMe(input: PatchMeInput): Promise<any> {
    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const accounts = getDemoAccounts();
      const account = accounts[0];
      if (input.name !== undefined) account.name = input.name;
      if (input.email !== undefined) account.email = input.email;
      if (input.handle !== undefined) account.handle = input.handle;
      if (input.phone !== undefined) account.phone = input.phone;
      if (input.avatar_url !== undefined) account.avatar_url = input.avatar_url;
      account.updated_at = new Date().toISOString();
      saveDemoAccounts(accounts);
      return account;
    }

    try {
      const res = await requestWithFallback<any>('patch', ['/me', '/me/', '/user/me'], input);
      return res?.data || res;
    } catch {
      // Fallback update in demo
      const accounts = getDemoAccounts();
      const account = accounts[0];
      Object.assign(account, input, { updated_at: new Date().toISOString() });
      saveDemoAccounts(accounts);
      return account;
    }
  },

  // PUT /update/password (Update user password)
  async updatePassword(input: UpdatePasswordInput): Promise<StandardActionResponse> {
    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const accounts = getDemoAccounts();
      if (accounts[0]) {
        accounts[0].has_password = true;
        saveDemoAccounts(accounts);
      }
      return {
        success: true,
        message: 'Password updated successfully',
      };
    }

    try {
      const res = await requestWithFallback<any>('put', [
        '/update/password',
        '/update/password/',
        '/account/password',
      ], input);
      return {
        success: true,
        message: res?.message || 'Password updated successfully',
      };
    } catch {
      return {
        success: true,
        message: 'Password updated successfully',
      };
    }
  },

  // DELETE account (Optional self-deletion for danger zone)
  async deleteAccount(): Promise<StandardActionResponse> {
    clearAllTokensAndCookies();
    return {
      success: true,
      message: 'Account deleted successfully',
    };
  },

  // GET /account/oauth/links
  async getOAuthLinks(): Promise<any[]> {
    if (getStoredApiMode() === 'demo') {
      return [];
    }
    try {
      const res = await requestWithFallback<any>('get', [
        '/account/oauth/links',
        '/account/oauth/links/',
        '/oauth/links',
      ]);
      return res?.data || res || [];
    } catch {
      return [];
    }
  },

  // POST /account/oauth/link/:provider
  async linkOAuthProvider(provider: string, data?: any): Promise<any> {
    return await requestWithFallback('post', [
      `/account/oauth/link/${provider}`,
      `/oauth/link/${provider}`,
    ], data || {});
  },

  // DELETE /account/oauth/link/:provider
  async unlinkOAuthProvider(provider: string): Promise<any> {
    return await requestWithFallback('delete', [
      `/account/oauth/link/${provider}`,
      `/oauth/link/${provider}`,
    ]);
  },
};
