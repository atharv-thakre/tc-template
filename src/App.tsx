import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { ApiConfigProvider } from './contexts/ApiConfigContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProfilePage } from './pages/ProfilePage';

// Dedicated Separate OAuth Callback Routers
import { GoogleCallbackPage } from './pages/oauth/GoogleCallbackPage';
import { GitHubCallbackPage } from './pages/oauth/GitHubCallbackPage';
import { DiscordCallbackPage } from './pages/oauth/DiscordCallbackPage';

// Dedicated Separate Magic Link Routers
import { MagicLinkLoginPage } from './pages/magic-link/MagicLinkLoginPage';
import { MagicLinkSignupPage } from './pages/magic-link/MagicLinkSignupPage';
import { MagicLinkResetPage } from './pages/magic-link/MagicLinkResetPage';
import { MagicLinkVerifyPage } from './pages/magic-link/MagicLinkVerifyPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function AppRouter() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const pathname = window.location.pathname;
    const search = window.location.search;

    // 1. Separate OAuth Callback Routers
    if (
      pathname.includes('/google/callback') ||
      (pathname.includes('/google') && (search.includes('code=') || search.includes('access_token=')))
    ) {
      return '/google/callback';
    }
    if (
      pathname.includes('/github/callback') ||
      (pathname.includes('/github') && (search.includes('code=') || search.includes('access_token=')))
    ) {
      return '/github/callback';
    }
    if (
      pathname.includes('/discord/callback') ||
      (pathname.includes('/discord') && (search.includes('code=') || search.includes('access_token=')))
    ) {
      return '/discord/callback';
    }

    // 2. Separate Magic Link Routers (Login, Signup, Reset, Verify)
    if (pathname.startsWith('/magic-link/login') || pathname.startsWith('/link/login')) {
      return '/magic-link/login';
    }
    if (pathname.startsWith('/magic-link/signup') || pathname.startsWith('/link/signup')) {
      return '/magic-link/signup';
    }
    if (
      pathname.startsWith('/magic-link/reset') ||
      pathname.startsWith('/link/reset') ||
      pathname.startsWith('/reset-password')
    ) {
      return '/magic-link/reset';
    }
    if (pathname.startsWith('/magic-link/verify') || pathname.startsWith('/link/verify')) {
      return '/magic-link/verify';
    }

    return pathname || '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      setCurrentPath(pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const { account } = useAuth();

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dedicated Separate OAuth Callback Routes (No common oauth route)
  if (currentPath === '/google/callback' || currentPath.startsWith('/google/callback')) {
    return <GoogleCallbackPage onNavigate={handleNavigate} />;
  }

  if (currentPath === '/github/callback' || currentPath.startsWith('/github/callback')) {
    return <GitHubCallbackPage onNavigate={handleNavigate} />;
  }

  if (currentPath === '/discord/callback' || currentPath.startsWith('/discord/callback')) {
    return <DiscordCallbackPage onNavigate={handleNavigate} />;
  }

  // Dedicated Separate Magic Link Routers (Login, Signup, Reset, Verify)
  if (
    currentPath === '/magic-link/login' ||
    currentPath.startsWith('/magic-link/login') ||
    currentPath.startsWith('/link/login')
  ) {
    return <MagicLinkLoginPage onNavigate={handleNavigate} />;
  }

  if (
    currentPath === '/magic-link/signup' ||
    currentPath.startsWith('/magic-link/signup') ||
    currentPath.startsWith('/link/signup')
  ) {
    return <MagicLinkSignupPage onNavigate={handleNavigate} />;
  }

  if (
    currentPath === '/magic-link/reset' ||
    currentPath.startsWith('/magic-link/reset') ||
    currentPath.startsWith('/link/reset') ||
    currentPath === '/reset-password' ||
    currentPath.startsWith('/reset-password')
  ) {
    return <MagicLinkResetPage onNavigate={handleNavigate} />;
  }

  if (
    currentPath === '/magic-link/verify' ||
    currentPath.startsWith('/magic-link/verify') ||
    currentPath.startsWith('/link/verify')
  ) {
    return <MagicLinkVerifyPage onNavigate={handleNavigate} />;
  }

  // Standalone Auth pages
  if (currentPath === '/login' || currentPath.startsWith('/login')) {
    return <LoginPage onNavigate={handleNavigate} />;
  }

  if (currentPath === '/signup') {
    return <SignupPage onNavigate={handleNavigate} />;
  }

  // If unauthenticated, redirect to Login
  if (!account) {
    return <LoginPage onNavigate={handleNavigate} />;
  }

  // Authenticated state: Profile Page inside AppLayout
  return (
    <AppLayout activePath="/profile" onNavigate={handleNavigate}>
      <ProfilePage onNavigate={handleNavigate} />
    </AppLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ApiConfigProvider>
          <AuthProvider>
            <AppRouter />
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </ApiConfigProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
