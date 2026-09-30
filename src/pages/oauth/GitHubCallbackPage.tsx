import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldAlert, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, tokenStorage } from '../../services/apiClient';

interface GitHubCallbackPageProps {
  onNavigate: (path: string) => void;
}

export const GitHubCallbackPage: React.FC<GitHubCallbackPageProps> = ({ onNavigate }) => {
  const { refetchMe } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      let hashParams: URLSearchParams | null = null;
      if (window.location.hash) {
        hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      }

      const errorParam = urlParams.get('error') || hashParams?.get('error');
      const errorDesc = urlParams.get('error_description') || hashParams?.get('error_description');
      const linkedParam = urlParams.get('linked') || hashParams?.get('linked');

      if (linkedParam === 'true') {
        window.history.replaceState({}, document.title, window.location.pathname);
        toast.success('Connected GitHub account successfully');
        onNavigate('/profile');
        return;
      }

      if (errorParam || linkedParam === 'false') {
        window.history.replaceState({}, document.title, window.location.pathname);
        setStatus('error');
        setErrorMessage(errorDesc || errorParam || 'GitHub authentication or account linking failed.');
        toast.error(errorDesc || errorParam || 'GitHub authentication failed');
        return;
      }

      // 1. Direct tokens in URL parameters
      const directToken =
        urlParams.get('access_token') ||
        urlParams.get('token') ||
        hashParams?.get('access_token') ||
        hashParams?.get('token');

      const directRefreshToken =
        urlParams.get('refresh_token') ||
        hashParams?.get('refresh_token');

      if (directToken) {
        try {
          tokenStorage.setTokens(directToken, directRefreshToken);
          window.history.replaceState({}, document.title, window.location.pathname);
          await refetchMe();
          setStatus('success');
          toast.success('Successfully signed in with GitHub');
          setTimeout(() => onNavigate('/profile'), 600);
          return;
        } catch (err: any) {
          setStatus('error');
          setErrorMessage(err.message || 'Failed to initialize session with GitHub token.');
          return;
        }
      }

      // 2. Authorization code exchange directly with GitHub callback route
      const code = urlParams.get('code') || hashParams?.get('code');
      if (code) {
        try {
          const res = await apiClient.get(`/github/callback?code=${encodeURIComponent(code)}`);
          const token = res.data?.access_token || res.data?.token;
          const refToken = res.data?.refresh_token || null;

          if (token) {
            tokenStorage.setTokens(token, refToken);
            window.history.replaceState({}, document.title, window.location.pathname);
            await refetchMe();
            setStatus('success');
            toast.success('Successfully authenticated with GitHub');
            setTimeout(() => onNavigate('/profile'), 600);
            return;
          }
        } catch (err: any) {
          setStatus('error');
          setErrorMessage(
            err.response?.data?.message || err.message || 'Failed to exchange GitHub authorization code.'
          );
          return;
        }
      }

      // 3. Fallback check for session cookie
      try {
        await refetchMe();
        setStatus('success');
        toast.success('GitHub session verified');
        setTimeout(() => onNavigate('/profile'), 600);
        return;
      } catch {
        // Continue to error
      }

      setStatus('error');
      setErrorMessage('Missing GitHub authorization code or token in callback URL.');
    };

    processCallback();
  }, []);

  return (
    <div className="min-h-screen bg-[#090b10] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-zinc-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#0f121d]/90 border border-white/10 backdrop-blur-2xl rounded-2xl p-7 shadow-2xl text-center">
        {/* GitHub Badge */}
        <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-inner text-white">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </div>

        {status === 'processing' && (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 text-zinc-300 animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-white tracking-tight">Signing in with GitHub...</h2>
            <p className="text-xs text-zinc-400">Verifying your GitHub identity and establishing session</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h2 className="text-lg font-bold text-white tracking-tight">GitHub Sign-In Successful</h2>
            <p className="text-xs text-zinc-400">Redirecting to your dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
            <h2 className="text-lg font-bold text-rose-400">GitHub Authentication Failed</h2>
            <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">{errorMessage}</p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="w-full py-2 px-4 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                <span>Return to Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
