import React from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { SITE_VERSION_LABEL } from '../../config/version';
import { DecryptedText } from '../reactbits/DecryptedText';
import { InfiniteMenu, InfiniteMenuItem } from '../reactbits/InfiniteMenu';

const defaultMenuItems: InfiniteMenuItem[] = [
  {
    image:
      'https://images.unsplash.com/photo-1782977389500-dd7adad33ebe?q=80&w=600&h=600&fit=crop&sat=-100&auto=format',
    link: 'https://google.com/',
    title: 'Zero-Trust Token Rotation',
    description: 'Stateless signed cryptographic JWTs with automated refresh token revocation.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1781499455083-6ccc3beb20cd?q=80&w=600&h=600&fit=crop&sat=-100&auto=format',
    link: 'https://google.com/',
    title: 'Passwordless & OTP Magic',
    description: 'Instant 6-digit email OTP verification codes and passwordless magic links.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1776394254711-4a0d7345269a?q=80&w=600&h=600&fit=crop&sat=-100&auto=format',
    link: 'https://google.com/',
    title: 'Global Session Governance',
    description: 'Active device tracking with one-click cross-platform session invalidation.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1781242629922-6f39cc3671cd?q=80&w=600&h=600&fit=crop&sat=-100&auto=format',
    link: 'https://google.com/',
    title: 'Enterprise OAuth & RBAC',
    description: 'Unified social single sign-on with multi-tenant role-based access control.',
  },
];

export const AuthLeftShowcase: React.FC = () => {
  return (
    <div className="flex flex-col justify-between h-full select-none max-w-xl space-y-6">
      {/* Brand Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white">tc-auth</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-800/90 text-zinc-400 border border-zinc-700/80 font-medium">
                <DecryptedText
                  text={SITE_VERSION_LABEL}
                  speed={40}
                  maxIterations={8}
                  animateOn="hover"
                />
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium">Enterprise Authentication Engine</p>
          </div>
        </div>

        {/* Hero Title */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Next-Gen Identity &{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
              Security Infrastructure
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-lg">
            Continuous auto-rotating cryptographic modules with stateless verification and zero-friction access.
          </p>
        </div>
      </div>

      {/* Infinite Menu 3D Carousel (Restricted to left side column, height ~520px - 580px) */}
      <div className="relative w-full rounded-3xl bg-[#0a0d16]/90 border border-zinc-800/90 shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-md">
        <div style={{ height: '480px', position: 'relative' }}>
          <InfiniteMenu items={defaultMenuItems} scale={1.8} autoSpeed={0.55} />
        </div>
      </div>

      {/* Bottom Trust Badge */}
      <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 font-medium">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>SOC-2 Ready Architecture</span>
        </div>
        <span className="font-mono text-zinc-500">99.99% Uptime SLA</span>
      </div>
    </div>
  );
};
