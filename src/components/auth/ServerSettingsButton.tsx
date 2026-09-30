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
      className={`group relative inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold transition-all duration-200 shadow-md cursor-pointer select-none backdrop-blur-xl overflow-hidden active:scale-[0.97] ${
        isLive
          ? 'bg-emerald-950/30 hover:bg-emerald-900/40 border-emerald-500/40 text-emerald-300 shadow-emerald-950/40 hover:border-emerald-400/60'
          : 'bg-amber-950/30 hover:bg-amber-900/40 border-amber-500/40 text-amber-300 shadow-amber-950/40 hover:border-amber-400/60'
      } ${className}`}
      title={`API Mode: ${isLive ? 'Live Server Mode' : 'Demo Mock Mode'}. Click to configure API server.`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isLive
            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse'
            : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse'
        }`}
      />
      <span className="text-zinc-200 font-medium tracking-wide">Server Settings</span>
      <span
        className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-full ${
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
