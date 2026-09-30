import React from 'react';
import { useApiConfig } from '../../contexts/ApiConfigContext';

interface ServerSettingsButtonProps {
  onClick: () => void;
  className?: string;
}

export const ServerSettingsButton: React.FC<ServerSettingsButtonProps> = ({ onClick, className = '' }) => {
  const { apiMode } = useApiConfig();
  const isLive = apiMode === 'live';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all shadow-md cursor-pointer select-none backdrop-blur-md ${
        isLive
          ? 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/40 text-emerald-300'
          : 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/40 text-amber-300'
      } ${className}`}
      title={`API Mode: ${isLive ? 'Live Server Mode' : 'Demo Mock Mode'}. Click to configure API server.`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isLive
            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse'
            : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse'
        }`}
      />
      <span className="text-zinc-200 font-medium">Server Settings</span>
      <span
        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
          isLive
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
        }`}
      >
        {isLive ? 'LIVE' : 'DEMO'}
      </span>
    </button>
  );
};
