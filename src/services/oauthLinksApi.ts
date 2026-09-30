import { OAuthLink } from '../types';
import { apiClient, getStoredApiMode } from './apiClient';

/**
 * Dedicated API service strictly for /account/oauth/links.
 * Direct single-call requests with zero fallbacks.
 */
export const oauthLinksApi = {
  async getOAuthLinks(): Promise<OAuthLink[]> {
    if (getStoredApiMode() === 'demo') {
      return [];
    }
    // Direct single API call to /account/oauth/links - zero fallbacks
    const res = await apiClient.get<any>('/account/oauth/links');
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  },

  async linkOAuthProvider(provider: string, data?: any): Promise<any> {
    // Direct single API call to /account/oauth/link/:provider
    const res = await apiClient.post<any>(`/account/oauth/link/${provider}`, data || {});
    return res.data;
  },

  async unlinkOAuthProvider(provider: string): Promise<any> {
    // Direct single API call to /account/oauth/:provider
    const res = await apiClient.delete<any>(`/account/oauth/${provider}`);
    return res.data;
  },
};
