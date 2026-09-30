import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldAlert, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, tokenStorage } from '../../services/apiClient';

interface DiscordCallbackPageProps {
  onNavigate: (path: string) => void;
}

export const DiscordCallbackPage: React.FC<DiscordCallbackPageProps> = ({ onNavigate }) => {
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
        toast.success('Connected Discord account successfully');
        onNavigate('/profile');
        return;
      }

      if (errorParam || linkedParam === 'false') {
        window.history.replaceState({}, document.title, window.location.pathname);
        setStatus('error');
        setErrorMessage(errorDesc || errorParam || 'Discord authentication or account linking failed.');
        toast.error(errorDesc || errorParam || 'Discord authentication failed');
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
          toast.success('Successfully signed in with Discord');
          setTimeout(() => onNavigate('/profile'), 600);
          return;
        } catch (err: any) {
          setStatus('error');
          setErrorMessage(err.message || 'Failed to initialize session with Discord token.');
          return;
        }
      }

      // 2. Authorization code exchange directly with Discord callback route
      const code = urlParams.get('code') || hashParams?.get('code');
      if (code) {
        try {
          const res = await apiClient.get(`/discord/callback?code=${encodeURIComponent(code)}`);
          const token = res.data?.access_token || res.data?.token;
          const refToken = res.data?.refresh_token || null;

          if (token) {
            tokenStorage.setTokens(token, refToken);
            window.history.replaceState({}, document.title, window.location.pathname);
            await refetchMe();
            setStatus('success');
            toast.success('Successfully authenticated with Discord');
            setTimeout(() => onNavigate('/profile'), 600);
            return;
          }
        } catch (err: any) {
          setStatus('error');
          setErrorMessage(
            err.response?.data?.message || err.message || 'Failed to exchange Discord authorization code.'
          );
          return;
        }
      }

      // 3. Fallback check for session cookie
      try {
        await refetchMe();
        setStatus('success');
        toast.success('Discord session verified');
        setTimeout(() => onNavigate('/profile'), 600);
        return;
      } catch {
        // Continue to error
      }

      setStatus('error');
      setErrorMessage('Missing Discord authorization code or token in callback URL.');
    };

    processCallback();
  }, []);

  return (
    <div className="min-h-screen bg-[#090b10] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[#5865F2]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#0f121d]/90 border border-white/10 backdrop-blur-2xl rounded-2xl p-7 shadow-2xl text-center">
        {/* Discord Badge */}
        <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-inner text-[#5865F2]">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
        </div>

        {status === 'processing' && (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 text-[#5865F2] animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-white tracking-tight">Signing in with Discord...</h2>
            <p className="text-xs text-zinc-400">Verifying your Discord identity and establishing session</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h2 className="text-lg font-bold text-white tracking-tight">Discord Sign-In Successful</h2>
            <p className="text-xs text-zinc-400">Redirecting to your dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
            <h2 className="text-lg font-bold text-rose-400">Discord Authentication Failed</h2>
            <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">{errorMessage}</p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="w-full py-2 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#5865F2]/20"
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
