import React from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Mail } from 'lucide-react';

interface MagicLinkVerifyPageProps {
  onNavigate: (path: string) => void;
}

export const MagicLinkVerifyPage: React.FC<MagicLinkVerifyPageProps> = ({ onNavigate }) => {
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const verified = searchParams.get('verified') === 'true';
  const email = searchParams.get('email');
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-[#090b10] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#0f121d]/90 border border-white/10 backdrop-blur-2xl rounded-2xl p-7 shadow-2xl text-center">
        {error ? (
          <div className="py-2 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">Verification Failed</h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                {decodeURIComponent(error)}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <span>Back to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-2 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">Email Verified!</h2>
              <p className="text-xs text-zinc-300">
                Your email <span className="font-semibold text-emerald-400">{email || 'address'}</span> has been successfully verified.
              </p>
              <p className="text-[11px] text-zinc-400">
                Your account is active. You can now sign in immediately.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
