import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  LayoutGrid,
  Mail,
  Hash,
  Phone,
  Calendar,
  Sparkles,
  Server,
  Braces,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useApiConfig } from '../contexts/ApiConfigContext';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { UserAvatar } from '../components/common/UserAvatar';
import { formatDate } from '../lib/utils';

// Isolated modular profile sub-components with independent lifecycles
import { ProfileInfoCard } from '../components/profile/ProfileInfoCard';
import { ConnectedAccountsCard } from '../components/profile/ConnectedAccountsCard';
import { PasswordChangeCard } from '../components/profile/PasswordChangeCard';
import { DangerZoneCard } from '../components/profile/DangerZoneCard';
import { AccountJsonModal } from '../components/profile/AccountJsonModal';

type ProfileSectionTab = 'all' | 'profile' | 'security';

export const ProfilePage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { account, session, payload, logout, logoutAll, isSuperAdmin, patchMe } = useAuth();
  const { apiMode } = useApiConfig();
  const [activeTab, setActiveTab] = useState<ProfileSectionTab>('all');
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [hasCopiedAccountJson, setHasCopiedAccountJson] = useState(false);

  if (!account) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-400">Please sign in to view your profile settings.</p>
      </div>
    );
  }

  // Construct raw account JSON representation without making unwanted network calls
  const rawAccountJson = {
    account,
    session: session || {
      id: `sess_${account.id}`,
      account_id: account.id,
      ip_address: '127.0.0.1',
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      created_at: account.created_at,
    },
    payload: payload || {
      sub: account.id,
      role: account.role,
      handle: account.handle,
    },
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(rawAccountJson, null, 2));
      setHasCopiedAccountJson(true);
      toast.success('Account JSON copied to clipboard!');
      setTimeout(() => setHasCopiedAccountJson(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const tabs: { id: ProfileSectionTab; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'All Settings', icon: LayoutGrid },
    { id: 'profile', label: 'Profile Info', icon: UserCheck },
    { id: 'security', label: 'Security & Auth', icon: Lock },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      <PageHeader
        title="Account & Profile"
        description="Manage your account profile, authentication credentials, and session security."
        badge={
          <div className="flex items-center gap-2">
            <Badge variant={isSuperAdmin ? 'purple' : 'info'} icon={<ShieldCheck className="w-3 h-3" />}>
              {account.role}
            </Badge>
            <Badge
              variant={apiMode === 'live' ? 'success' : 'warning'}
              icon={<Server className="w-3 h-3" />}
              className="font-mono text-[10px]"
            >
              {apiMode === 'live' ? 'Live Server' : 'Demo Mode'}
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Clean Profile Summary, Action Buttons & Section Navigator */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-white/10 bg-[#0c0e15]/75 backdrop-blur-2xl ring-1 ring-white/5 shadow-xl rounded-2xl relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <CardHeader className="text-center pb-3 pt-6">
              <div className="flex justify-center mb-3 relative">
                <div className="p-1 rounded-full bg-gradient-to-br from-indigo-500/40 via-purple-500/20 to-transparent shadow-lg">
                  <UserAvatar src={account.avatar_url} name={account.name} size="xl" />
                </div>
              </div>
              <CardTitle className="text-white text-lg font-bold tracking-tight">{account.name}</CardTitle>
              <p className="font-mono text-xs text-indigo-400 mt-0.5">@{account.handle}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant={account.status === 'active' ? 'success' : 'warning'} size="sm">
                  {account.status}
                </Badge>
                <span className="text-[10px] font-mono text-zinc-500">ID #{account.id}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-2.5 pt-2 text-xs border-t border-white/5">
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Email</span>
                </span>
                <span className="font-medium text-zinc-200 truncate max-w-[180px]">{account.email}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-zinc-500" />
                  <span>UID</span>
                </span>
                <span className="font-mono text-zinc-300 text-[11px]">{account.uid || `usr_${account.id}`}</span>
              </div>

              {account.phone && (
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Phone</span>
                  </span>
                  <span className="text-zinc-200">{account.phone}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-1.5">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Member Since</span>
                </span>
                <span className="font-mono text-zinc-300 text-[11px]">{formatDate(account.created_at)}</span>
              </div>

              {/* View JSON and Copy JSON Action Buttons in Account Card */}
              <div className="pt-3 mt-1 border-t border-white/10 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsJsonModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer active:scale-95 shadow-xs"
                  title="View raw account JSON in a modal"
                >
                  <Braces className="w-3.5 h-3.5 text-indigo-400" />
                  <span>View JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-xs font-semibold text-white transition-all cursor-pointer active:scale-95 shadow-md shadow-indigo-600/20"
                  title="Copy raw account JSON to clipboard"
                >
                  {hasCopiedAccountJson ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span className="text-emerald-200">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>

              {/* Mode Notice */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <div
                  className={`p-2.5 rounded-xl border text-[11px] ${
                    apiMode === 'live'
                      ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                      : 'bg-amber-950/20 border-amber-500/20 text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <Sparkles className="w-3 h-3" />
                    <span>{apiMode === 'live' ? 'Live Server Connected' : 'Demo Mode Active'}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    {apiMode === 'live'
                      ? 'Live requests are routed to your configured backend server.'
                      : 'Network calls are disabled. All data is read from local mock memory.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Category Navigation Card */}
          <Card className="border-white/10 bg-[#0c0e15]/70 backdrop-blur-2xl ring-1 ring-white/5 shadow-xl rounded-2xl p-2">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 py-1.5">
              Sections
            </div>
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600/20 border border-indigo-500/30 text-white shadow-xs'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                      <span>{tab.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Consistent, Modular Settings Cards */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {/* General Profile Section */}
            {(activeTab === 'all' || activeTab === 'profile') && (
              <motion.div
                key="profile-section"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <ProfileInfoCard account={account} onUpdateProfile={patchMe} />
                <ConnectedAccountsCard accountId={account.id} />
              </motion.div>
            )}

            {/* Security Section */}
            {(activeTab === 'all' || activeTab === 'security') && (
              <motion.div
                key="security-section"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <PasswordChangeCard hasPassword={account.has_password} />
                <DangerZoneCard onLogout={logout} onLogoutAll={logoutAll} onNavigate={onNavigate} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Raw Account JSON Modal */}
      <AccountJsonModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        data={rawAccountJson}
      />
    </motion.div>
  );
};
