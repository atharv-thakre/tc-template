import { MeResponse, PatchMeInput, Account } from '../types';
import { apiClient, getStoredApiMode, LOCAL_STORAGE_TOKEN_KEY } from './apiClient';
import { getDemoAccounts, saveDemoAccounts } from './auth';

/**
 * Dedicated API service strictly for /me endpoint operations.
 * Direct single-call requests with zero fallbacks.
 */
export const meApi = {
  async getMe(): Promise<MeResponse> {
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (!token) {
      throw new Error('Not authenticated');
    }

    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 80));
      const accounts = getDemoAccounts();
      const matched = accounts[0];
      return {
        account: matched,
        session: {
          id: `sess_${matched.id}`,
          account_id: matched.id,
          ip_address: '127.0.0.1',
          user_agent: 'Client Web Browser',
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
          created_at: new Date().toISOString(),
        },
        payload: {
          sub: matched.id,
          role: matched.role,
          handle: matched.handle,
        },
      };
    }

    // Direct single API call to /me - no fallback candidates
    const res = await apiClient.get<any>('/me');
    const payload = res.data?.data || res.data || {};

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
  },

  async patchMe(input: PatchMeInput): Promise<Account> {
    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 100));
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

    // Direct single API call to /me - no fallback candidates
    const res = await apiClient.patch<any>('/me', input);
    return res.data?.data || res.data;
  },
};
