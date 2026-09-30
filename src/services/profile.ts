import { MeResponse, PatchMeInput, StandardActionResponse, UpdatePasswordInput, OAuthLink } from '../types';
import { meApi } from './meApi';
import { oauthLinksApi } from './oauthLinksApi';
import { securityApi } from './securityApi';

/**
 * Profile service facade.
 * All requests route directly to their single dedicated API endpoint with zero fallbacks.
 */
export const profileService = {
  // GET /me (direct single API call)
  async getMe(_forceRefresh = false): Promise<MeResponse> {
    return meApi.getMe();
  },

  // PATCH /me (direct single API call)
  async patchMe(input: PatchMeInput): Promise<any> {
    return meApi.patchMe(input);
  },

  // PUT /update/password (direct single API call)
  async updatePassword(input: UpdatePasswordInput): Promise<StandardActionResponse> {
    return securityApi.updatePassword(input);
  },

  // DELETE account
  async deleteAccount(): Promise<StandardActionResponse> {
    return securityApi.deleteAccount();
  },

  // GET /account/oauth/links (direct single API call)
  async getOAuthLinks(_forceRefresh = false): Promise<OAuthLink[]> {
    return oauthLinksApi.getOAuthLinks();
  },

  // POST /account/oauth/link/:provider (direct single API call)
  async linkOAuthProvider(provider: string, data?: any): Promise<any> {
    return oauthLinksApi.linkOAuthProvider(provider, data);
  },

  // DELETE /account/oauth/:provider (direct single API call)
  async unlinkOAuthProvider(provider: string): Promise<any> {
    return oauthLinksApi.unlinkOAuthProvider(provider);
  },
};
