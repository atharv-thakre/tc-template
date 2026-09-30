import React, { createContext, useContext, useEffect, useState } from 'react';
import { clearAllTokensAndCookies, tokenStorage } from '../services/apiClient';
import { authService } from '../services/auth';
import { profileService } from '../services/profile';
import {
  Account,
  ForgotPasswordInput,
  LoginOTPInput,
  LoginPasswordInput,
  PatchMeInput,
  SessionInfo,
  SignupOTPInput,
  SignupPasswordInput,
} from '../types';

interface AuthContextType {
  account: Account | null;
  session: SessionInfo | null;
  payload: Record<string, unknown> | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  loginPassword: (input: LoginPasswordInput) => Promise<void>;
  loginOTP: (input: LoginOTPInput) => Promise<void>;
  loginMagicLink: (input: { email: string; otp: string }) => Promise<void>;
  signupPassword: (input: SignupPasswordInput) => Promise<void>;
  signupOTP: (input: SignupOTPInput) => Promise<void>;
  forgotPassword: (input: ForgotPasswordInput) => Promise<void>;
  loginOAuth: (provider: 'google' | 'github' | 'discord') => Promise<void>;
  patchMe: (input: PatchMeInput) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshToken: () => Promise<{ access_token: string; refresh_token: string; token_type: string }>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialToken(): string | null {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromQuery = urlParams.get('access_token') || urlParams.get('token');
    const refreshFromQuery = urlParams.get('refresh_token');
    if (tokenFromQuery) {
      tokenStorage.setTokens(tokenFromQuery, refreshFromQuery);
      return tokenFromQuery;
    }
  } catch {
    // ignore
  }
  return tokenStorage.getAccessToken();
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [token, setToken] = useState<string | null>(getInitialToken);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const clearAuthAndRedirectToLogin = () => {
    clearAllTokensAndCookies();
    setToken(null);
    setAccount(null);
    setSession(null);
    setPayload(null);
    const path = window.location.pathname;
    if (path !== '/login' && path !== '/signup') {
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const fetchCurrentUser = async () => {
    const currentToken = tokenStorage.getAccessToken();
    if (!currentToken) {
      setAccount(null);
      setSession(null);
      setPayload(null);
      setIsLoading(false);
      return;
    }

    try {
      const meData = await profileService.getMe();
      if (meData?.account) {
        setAccount(meData.account);
        setSession(meData.session || null);
        setPayload(meData.payload || null);
      } else {
        clearAuthAndRedirectToLogin();
      }
    } catch {
      clearAuthAndRedirectToLogin();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const loginPassword = async (input: LoginPasswordInput) => {
    const res = await authService.loginPassword(input);
    setToken(res.access_token);
    setAccount(res.account);
    await fetchCurrentUser();
  };

  const loginOTP = async (input: LoginOTPInput) => {
    const res = await authService.loginOTP(input);
    setToken(res.access_token);
    setAccount(res.account);
    await fetchCurrentUser();
  };

  const loginMagicLink = async (input: { email: string; otp: string }) => {
    const res = await authService.verifyMagicLink('login', input);
    setToken(res.access_token);
    setAccount(res.account);
    await fetchCurrentUser();
  };

  const signupPassword = async (input: SignupPasswordInput) => {
    const res = await authService.signupPassword(input);
    setToken(res.access_token);
    setAccount(res.account);
    await fetchCurrentUser();
  };

  const signupOTP = async (input: SignupOTPInput) => {
    const res = await authService.signupOTP(input);
    setToken(res.access_token);
    setAccount(res.account);
    await fetchCurrentUser();
  };

  const forgotPassword = async (input: ForgotPasswordInput) => {
    const res = await authService.forgotPassword(input);
    setToken(res.access_token);
    setAccount(res.account);
    await fetchCurrentUser();
  };

  const loginOAuth = async (provider: 'google' | 'github' | 'discord') => {
    // In demo mode mock OAuth response
    const mockEmail = `demo_${provider}@tcauth.dev`;
    const res = await authService.loginPassword({ identifier: mockEmail, password: 'password123' });
    setToken(res.access_token);
    setAccount(res.account);
    await fetchCurrentUser();
  };

  const patchMe = async (input: PatchMeInput) => {
    const updated = await profileService.patchMe(input);
    setAccount((prev) => (prev ? { ...prev, ...updated } : updated));
  };

  const updatePassword = async (password: string) => {
    await profileService.updatePassword({ password });
    if (account) {
      setAccount({ ...account, has_password: true });
    }
  };

  const refreshToken = async () => {
    const res = await authService.refreshToken();
    setToken(res.access_token);
    return res;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      clearAuthAndRedirectToLogin();
    }
  };

  const logoutAll = async () => {
    try {
      await authService.logoutAll();
    } catch {
      // ignore
    } finally {
      clearAuthAndRedirectToLogin();
    }
  };

  const isSuperAdmin = account?.role === 'superadmin';

  return (
    <AuthContext.Provider
      value={{
        account,
        session,
        payload,
        token,
        isLoading,
        isAuthenticated: !!account,
        isSuperAdmin,
        loginPassword,
        loginOTP,
        loginMagicLink,
        signupPassword,
        signupOTP,
        forgotPassword,
        loginOAuth,
        patchMe,
        updatePassword,
        refreshToken,
        logout,
        signOut: logout,
        logoutAll,
        refetchMe: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
