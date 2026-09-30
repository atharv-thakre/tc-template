import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { tokenStorage } from '../../services/apiClient';

interface MagicLinkLoginPageProps {
  onNavigate: (path: string) => void;
}

export const MagicLinkLoginPage: React.FC<MagicLinkLoginPageProps> = ({ onNavigate }) => {
  const { refetchMe } = useAuth();
  const [status, setStatus] = useState<'validating' | 'success' | 'error'>('validating');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleLoginLink = async () => {
      const params = new URLSearchParams(window.location.search);
      let hashParams: URLSearchParams | null = null;
      if (window.location.hash) {
        hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      }

      const error = params.get('error') || hashParams?.get('error');
      if (error) {
        setStatus('error');
        setErrorMessage(decodeURIComponent(error));
        toast.error('Magic link sign-in failed');
        return;
      }

      // 1. Direct tokens passed from server redirection
      const directToken =
        params.get('access_token') ||
        params.get('token') ||
        hashParams?.get('access_token') ||
        hashParams?.get('token');

      const directRefreshToken =
        params.get('refresh_token') ||
        hashParams?.get('refresh_token');

      if (directToken) {
        try {
          tokenStorage.setTokens(directToken, directRefreshToken);
          window.history.replaceState({}, document.title, window.location.pathname);
          await refetchMe();
          setStatus('success');
          toast.success('Signed in via Magic Link');
          setTimeout(() => onNavigate('/profile'), 700);
          return;
        } catch (err: any) {
          setStatus('error');
          setErrorMessage(err.message || 'Failed to authenticate with token');
          return;
        }
      }

      // 2. Direct email & OTP parameters (if forwarded directly)
      const email = params.get('email');
      const otp = params.get('otp');

      if (email && otp) {
        try {
          const res = await authService.verifyMagicLink('login', { email, otp });
          if (res.access_token) {
            tokenStorage.setTokens(res.access_token, res.refresh_token);
            window.history.replaceState({}, document.title, window.location.pathname);
            await refetchMe();
            setStatus('success');
            toast.success('Signed in via Magic Link');
            setTimeout(() => onNavigate('/profile'), 700);
            return;
          }
        } catch (err: any) {
          setStatus('error');
          setErrorMessage(
            err.response?.data?.message || err.response?.data?.error || err.message || 'Magic link verification failed'
          );
          return;
        }
      }

      // 3. Fallback check for session cookie
      try {
        await refetchMe();
        setStatus('success');
        toast.success('Session verified');
        setTimeout(() => onNavigate('/profile'), 700);
        return;
      } catch {
        // Continue to error
      }

      setStatus('error');
      setErrorMessage('Missing login verification credentials or link has expired.');
    };

    handleLoginLink();
  }, []);

  return (
    <div className="min-h-screen bg-[#090b10] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#0f121d]/90 border border-white/10 backdrop-blur-2xl rounded-2xl p-7 shadow-2xl text-center">
        {/* Magic Link Login Icon */}
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Sparkles className="w-6 h-6" />
        </div>

        {status === 'validating' && (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-white tracking-tight">Verifying Magic Link...</h2>
            <p className="text-xs text-zinc-400">Authenticating your session with secure token</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h2 className="text-lg font-bold text-white tracking-tight">Magic Link Verified!</h2>
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Session confirmed. Redirecting to your dashboard...</span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-rose-400">Sign-In Link Expired or Invalid</h2>
            <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">{errorMessage}</p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <span>Request New Sign-In Link</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
