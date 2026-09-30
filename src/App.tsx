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
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { MagicLinkCallbackPage } from './pages/MagicLinkCallbackPage';

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
    if (
      pathname.includes('/callback') ||
      pathname.includes('/oauth') ||
      search.includes('access_token=') ||
      search.includes('code=')
    ) {
      if (pathname.includes('github')) return '/github/callback';
      if (pathname.includes('google')) return '/google/callback';
      if (pathname.includes('discord')) return '/discord/callback';
      return '/oauth/callback';
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

  // Standalone Auth pages
  if (currentPath === '/login') {
    return <LoginPage onNavigate={handleNavigate} />;
  }

  if (currentPath === '/signup') {
    return <SignupPage onNavigate={handleNavigate} />;
  }

  if (currentPath === '/magic-link/callback' || currentPath.startsWith('/magic-link/callback')) {
    return <MagicLinkCallbackPage onNavigate={handleNavigate} />;
  }

  if (
    currentPath === '/google/callback' ||
    currentPath === '/github/callback' ||
    currentPath === '/discord/callback' ||
    currentPath === '/oauth/callback' ||
    currentPath.includes('/callback')
  ) {
    const provider = currentPath.includes('github')
      ? 'github'
      : currentPath.includes('discord')
      ? 'discord'
      : 'google';
    return <OAuthCallbackPage provider={provider} onNavigate={handleNavigate} />;
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
