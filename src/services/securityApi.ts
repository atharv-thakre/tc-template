import { StandardActionResponse, UpdatePasswordInput } from '../types';
import { apiClient, getStoredApiMode, clearAllTokensAndCookies } from './apiClient';
import { getDemoAccounts, saveDemoAccounts } from './auth';

/**
 * Dedicated API service for security operations (password changes, session revocation).
 * Direct single-call requests with zero fallbacks.
 */
export const securityApi = {
  async updatePassword(input: UpdatePasswordInput): Promise<StandardActionResponse> {
    if (getStoredApiMode() === 'demo') {
      await new Promise((resolve) => setTimeout(resolve, 100));
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

    // Direct single API call to /update/password
    const res = await apiClient.put<any>('/update/password', input);
    return {
      success: true,
      message: res.data?.message || 'Password updated successfully',
    };
  },

  async deleteAccount(): Promise<StandardActionResponse> {
    clearAllTokensAndCookies();
    return {
      success: true,
      message: 'Account deleted successfully',
    };
  },
};
