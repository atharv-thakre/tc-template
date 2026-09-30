import React, { useState } from 'react';
import { LogOut, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common/Card';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { getErrorMessage } from '../../services/apiClient';

interface DangerZoneCardProps {
  onLogout: () => Promise<void>;
  onLogoutAll: () => Promise<void>;
  onNavigate: (path: string) => void;
}

export const DangerZoneCard: React.FC<DangerZoneCardProps> = ({ onLogout, onLogoutAll, onNavigate }) => {
  const [isLoggingOutCurrent, setIsLoggingOutCurrent] = useState(false);
  const [isLogoutAllDialogOpen, setIsLogoutAllDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOutCurrent(true);
    try {
      await onLogout();
      toast.success('Signed out successfully');
      onNavigate('/login');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to sign out'));
    } finally {
      setIsLoggingOutCurrent(false);
    }
  };

  const handleConfirmLogoutAll = async () => {
    setIsSubmitting(true);
    try {
      await onLogoutAll();
      toast.success('All active sessions terminated');
      setIsLogoutAllDialogOpen(false);
      onNavigate('/login');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to terminate all sessions'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="border-white/10 bg-[#0c0e15]/70 backdrop-blur-2xl ring-1 ring-white/5 shadow-xl rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base font-bold">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <span>Session Security & Sign Out</span>
          </CardTitle>
          <CardDescription className="mt-1 text-xs text-zinc-400">
            Terminate the current active session or invalidate tokens across all devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isLoggingOutCurrent}
              className="flex-1 py-2 px-3 text-xs font-semibold text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-400" />
              <span>{isLoggingOutCurrent ? 'Signing Out...' : 'Sign Out This Device'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLogoutAllDialogOpen(true)}
              className="flex-1 py-2 px-3 text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-xs"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out All Devices</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={isLogoutAllDialogOpen}
        title="Sign Out Everywhere?"
        description="This will invalidate all access and refresh tokens for this account across every browser and device. You will need to sign in again."
        confirmText={isSubmitting ? 'Terminating...' : 'Sign Out All Sessions'}
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmLogoutAll}
        onClose={() => setIsLogoutAllDialogOpen(false)}
      />
    </>
  );
};
