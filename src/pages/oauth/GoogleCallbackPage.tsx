import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldAlert, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, tokenStorage } from '../../services/apiClient';

interface GoogleCallbackPageProps {
  onNavigate: (path: string) => void;
}

export const GoogleCallbackPage: React.FC<GoogleCallbackPageProps> = ({ onNavigate }) => {
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
        toast.success('Connected Google account successfully');
        onNavigate('/profile');
        return;
      }

      if (errorParam || linkedParam === 'false') {
        window.history.replaceState({}, document.title, window.location.pathname);
        setStatus('error');
        setErrorMessage(errorDesc || errorParam || 'Google authentication or account linking failed.');
        toast.error(errorDesc || errorParam || 'Google authentication failed');
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
          toast.success('Successfully signed in with Google');
          setTimeout(() => onNavigate('/profile'), 600);
          return;
        } catch (err: any) {
          setStatus('error');
          setErrorMessage(err.message || 'Failed to initialize session with Google token.');
          return;
        }
      }

      // 2. Authorization code exchange directly with Google callback route
      const code = urlParams.get('code') || hashParams?.get('code');
      if (code) {
        try {
          const res = await apiClient.get(`/google/callback?code=${encodeURIComponent(code)}`);
          const token = res.data?.access_token || res.data?.token;
          const refToken = res.data?.refresh_token || null;

          if (token) {
            tokenStorage.setTokens(token, refToken);
            window.history.replaceState({}, document.title, window.location.pathname);
            await refetchMe();
            setStatus('success');
            toast.success('Successfully authenticated with Google');
            setTimeout(() => onNavigate('/profile'), 600);
            return;
          }
        } catch (err: any) {
          setStatus('error');
          setErrorMessage(
            err.response?.data?.message || err.message || 'Failed to exchange Google authorization code.'
          );
          return;
        }
      }

      // 3. Fallback check for session cookie
      try {
        await refetchMe();
        setStatus('success');
        toast.success('Google session verified');
        setTimeout(() => onNavigate('/profile'), 600);
        return;
      } catch {
        // Continue to error
      }

      setStatus('error');
      setErrorMessage('Missing Google authorization code or token in callback URL.');
    };

    processCallback();
  }, []);

  return (
    <div className="min-h-screen bg-[#090b10] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#0f121d]/90 border border-white/10 backdrop-blur-2xl rounded-2xl p-7 shadow-2xl text-center">
        {/* Google Badge */}
        <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        </div>

        {status === 'processing' && (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-white tracking-tight">Signing in with Google...</h2>
            <p className="text-xs text-zinc-400">Verifying your Google identity and establishing session</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h2 className="text-lg font-bold text-white tracking-tight">Google Sign-In Successful</h2>
            <p className="text-xs text-zinc-400">Redirecting to your dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
            <h2 className="text-lg font-bold text-rose-400">Google Authentication Failed</h2>
            <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">{errorMessage}</p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="w-full py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
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
