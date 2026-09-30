import React from 'react';
import { KeyRound } from 'lucide-react';

interface TcAuthLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  version?: string;
  onClick?: () => void;
}

export const TcAuthLogo: React.FC<TcAuthLogoProps> = ({
  className = '',
  size = 'md',
  version,
  onClick,
}) => {
  const iconSizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  const boxSizeClass =
    size === 'sm'
      ? 'w-8 h-8 rounded-lg'
      : size === 'lg'
      ? 'w-12 h-12 rounded-2xl'
      : 'w-9 h-9 rounded-xl';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div
        className={`bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 ${boxSizeClass}`}
      >
        <KeyRound className={iconSizeClass} />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-black text-sm tracking-tight text-white">tc-auth</span>
        {version && (
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            {version}
          </span>
        )}
      </div>
    </div>
  );
};
