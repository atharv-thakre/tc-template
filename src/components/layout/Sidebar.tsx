import React from 'react';
import { toast } from 'sonner';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

interface SidebarProps {
  activePath: string;
  onNavigate: (path: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePath,
  onNavigate,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { account, signOut } = useAuth();

  const handleNavClick = (path: string) => {
    onNavigate(path);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 z-40 flex flex-col w-64 bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 transition-transform duration-200 ease-in-out md:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col flex-1 p-4 overflow-y-auto space-y-6">
          {/* Navigation Section */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">
              Navigation
            </p>
            <button
              onClick={() => handleNavClick('/profile')}
              className={cn(
                'flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all group border border-transparent cursor-pointer',
                activePath === '/profile'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 dark:bg-zinc-900 dark:text-white dark:border-zinc-800'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900/60 hover:text-slate-900 dark:hover:text-zinc-100'
              )}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                <span>My Profile</span>
              </div>
            </button>
          </div>

          {/* User Sign Out */}
          {account && (
            <div className="mt-auto pt-2">
              <button
                onClick={() => {
                  signOut();
                  onCloseMobile();
                  onNavigate('/login');
                  toast.success('Signed out successfully');
                }}
                className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
