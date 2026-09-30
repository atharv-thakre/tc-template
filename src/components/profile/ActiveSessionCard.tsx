import React from 'react';
import { ShieldCheck, Globe, KeyRound } from 'lucide-react';
import { SessionInfo } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common/Card';
import { formatDate } from '../../lib/utils';

interface ActiveSessionCardProps {
  session: SessionInfo | null;
  payload: Record<string, unknown> | null;
}

export const ActiveSessionCard: React.FC<ActiveSessionCardProps> = ({ session, payload }) => {
  return (
    <Card className="border-white/10 bg-[#0c0e15]/60 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Active Session & Telemetry</span>
        </CardTitle>
        <CardDescription>
          Security metadata and verified claims associated with your active bearer token.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {session ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-zinc-500 block mb-0.5">Session ID</span>
              <span className="font-mono text-zinc-300 truncate block">{session.id}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-zinc-500 block mb-0.5">Origin IP Address</span>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-mono">{session.ip_address || '127.0.0.1'}</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 sm:col-span-2">
              <span className="text-zinc-500 block mb-0.5">Client User Agent</span>
              <span className="font-mono text-zinc-300 text-[11px] truncate block">
                {session.user_agent || navigator.userAgent}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-zinc-500 block mb-0.5">Established At</span>
              <span className="text-zinc-300">{formatDate(session.created_at)}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-zinc-500 block mb-0.5">Expires At</span>
              <span className="text-zinc-300">{formatDate(session.expires_at)}</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-400">
            Session verified via standard JWT authentication header.
          </div>
        )}

        {payload && Object.keys(payload).length > 0 && (
          <div className="pt-2">
            <span className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Verified Claims (JWT Payload)
            </span>
            <pre className="p-3 rounded-xl bg-black/60 border border-zinc-800 text-[11px] font-mono text-indigo-300 overflow-x-auto">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
