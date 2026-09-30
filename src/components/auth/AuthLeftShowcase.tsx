import React from 'react';
import { ShieldCheck, Zap, Lock, CheckCircle2 } from 'lucide-react';
import { SITE_VERSION_LABEL } from '../../config/version';
import { DecryptedText } from '../reactbits/DecryptedText';

export const AuthLeftShowcase: React.FC = () => {
  return (
    <div className="flex flex-col justify-between h-full py-4 lg:py-6 select-none max-w-xl">
      {/* Brand Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21 2-2 2m-1.5 1.5L14 9M3 21l6.5-6.5" />
              <path d="M19 5a4.24 4.24 0 0 0-6 0l-2 2a4.24 4.24 0 0 0 0 6l2 2a4.24 4.24 0 0 0 6 0l2-2a4.24 4.24 0 0 0 0-6Z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white">tc-auth</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-800/90 text-zinc-400 border border-zinc-700/80 font-medium">
                <DecryptedText text={SITE_VERSION_LABEL} speed={40} maxIterations={8} animateOn="hover" />
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium">Enterprise Authentication Engine</p>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-semibold shadow-sm">
          <span className="text-indigo-400">✨</span>
          <span>Next-Generation Identity Security</span>
        </div>

        {/* Hero Typography */}
        <div className="space-y-3 pt-1">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-[1.12]">
            Build With <br />
            Confidence. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
              Enterprise-Grade <br className="hidden sm:inline" />
              Auth.
            </span>
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-lg">
            Stateless signed tokens, single-use rotating refresh credentials, passwordless magic links, and granular cross-device session governance.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="space-y-3 pt-3">
          {/* Card 1: Zero-Trust */}
          <div className="p-4 rounded-2xl bg-[#0d1017]/80 border border-zinc-800/80 flex items-start gap-4 backdrop-blur-xs transition-colors hover:border-zinc-700/80">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-zinc-100">Zero-Trust Token Rotation</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Multi-tier JWT architecture with automated refresh cycles and instant token revocation.
              </p>
            </div>
          </div>

          {/* Card 2: Passwordless */}
          <div className="p-4 rounded-2xl bg-[#0d1017]/80 border border-zinc-800/80 flex items-start gap-4 backdrop-blur-xs transition-colors hover:border-zinc-700/80">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-zinc-100">Passwordless & Social SSO</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                High-security email 6-digit OTP codes, one-touch magic links, and Google, GitHub, and Discord OAuth.
              </p>
            </div>
          </div>

          {/* Card 3: Governance */}
          <div className="p-4 rounded-2xl bg-[#0d1017]/80 border border-zinc-800/80 flex items-start gap-4 backdrop-blur-xs transition-colors hover:border-zinc-700/80">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-zinc-100">Global Session Governance</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Real-time active device tracking with one-click cross-platform session invalidation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Trust Badge */}
      <div className="pt-8 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 font-medium">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>SOC-2 Ready Architecture</span>
        </div>
        <span className="font-mono text-zinc-400">99.99% Uptime SLA</span>
      </div>
    </div>
  );
};
