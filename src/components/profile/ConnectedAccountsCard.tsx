import React, { useState, useEffect } from 'react';
import { Link2, Link2Off, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';
import { OAuthLink } from '../../types';
import { oauthLinksApi } from '../../services/oauthLinksApi';
import { authService } from '../../services/auth';
import { getStoredApiMode } from '../../services/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common/Card';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { getErrorMessage } from '../../services/apiClient';

interface ConnectedAccountsCardProps {
  accountId?: string | number;
}

export const ConnectedAccountsCard: React.FC<ConnectedAccountsCardProps> = ({ accountId }) => {
  const [oauthLinks, setOauthLinks] = useState<OAuthLink[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);
  const [isUnlinkConfirmOpen, setIsUnlinkConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load OAuth links strictly once per account ID (skipped in demo mode)
  const loadLinks = async () => {
    if (getStoredApiMode() === 'demo') {
      setOauthLinks([]);
      return;
    }
    setIsLoadingLinks(true);
    try {
      const links = await oauthLinksApi.getOAuthLinks();
      setOauthLinks(links || []);
    } catch {
      setOauthLinks([]);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  useEffect(() => {
    if (accountId && getStoredApiMode() !== 'demo') {
      loadLinks();
    }
  }, [accountId]);

  const handleLink = async (provider: 'google' | 'github' | 'discord') => {
    if (getStoredApiMode() === 'demo') {
      toast.info(`OAuth linking is disabled in Demo Mode. Switch to Live Server mode in Server Settings.`);
      return;
    }
    try {
      const res = await oauthLinksApi.linkOAuthProvider(provider, { frontend_url: window.location.origin });
      if (res && res.redirect_url) {
        const target = res.redirect_url.startsWith('http')
          ? res.redirect_url
          : `${authService.getOAuthLoginUrl(provider)}&action=link`;
        window.location.href = target;
        return;
      }
      toast.success(`Connected ${provider} successfully`);
      loadLinks();
    } catch {
      const loginUrl = authService.getOAuthLoginUrl(provider);
      window.location.href = `${loginUrl}&action=link`;
    }
  };

  const handleConfirmUnlink = async () => {
    if (!unlinkingProvider) return;
    setIsSubmitting(true);
    try {
      const res = await oauthLinksApi.unlinkOAuthProvider(unlinkingProvider);
      toast.success(res?.message || `Unlinked ${unlinkingProvider} successfully`);
      setIsUnlinkConfirmOpen(false);
      setUnlinkingProvider(null);
      loadLinks();
    } catch (err: any) {
      toast.error(getErrorMessage(err, `Lockout Prevention: Cannot unlink ${unlinkingProvider}`));
    } finally {
      setIsSubmitting(false);
    }
  };

  const providers = [
    {
      id: 'google' as const,
      name: 'Google',
      icon: (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
      ),
      description: 'Single sign-on via Google Account',
    },
    {
      id: 'github' as const,
      name: 'GitHub',
      icon: (
        <svg className="w-5 h-5 fill-current text-white shrink-0" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
      description: 'Single sign-on via GitHub developer account',
    },
    {
      id: 'discord' as const,
      name: 'Discord',
      icon: (
        <svg className="w-5 h-5 fill-[#5865F2] shrink-0" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      ),
      description: 'Single sign-on via Discord account',
    },
  ];

  return (
    <>
      <Card className="border-white/10 bg-[#0c0e15]/70 backdrop-blur-2xl ring-1 ring-white/5 shadow-xl rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base font-bold">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-inner">
                  <Link2 className="w-3.5 h-3.5" />
                </div>
                <span>Connected Accounts</span>
              </CardTitle>
              <CardDescription className="mt-1 text-xs text-zinc-400">
                Manage third-party OAuth providers linked for seamless single sign-on.
              </CardDescription>
            </div>
            {getStoredApiMode() !== 'demo' && (
              <button
                type="button"
                onClick={loadLinks}
                disabled={isLoadingLinks}
                className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer active:scale-95"
                title="Reload Connected Accounts"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLinks ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {providers.map((p) => {
              const link = oauthLinks.find(
                (l) => l.provider.toLowerCase() === p.id.toLowerCase()
              );
              const isLinked = Boolean(link);

              return (
                <div
                  key={p.id}
                  className="flex flex-col justify-between p-3.5 rounded-xl border border-white/10 bg-black/40 hover:bg-black/60 transition-all duration-200"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {p.icon}
                        <span className="text-xs font-semibold text-white">{p.name}</span>
                      </div>
                      {isLinked ? (
                        <Badge variant="success" size="sm" className="gap-1 text-[10px]">
                          <Check className="w-3 h-3" />
                          <span>Linked</span>
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-zinc-500 font-medium">Not linked</span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">{p.description}</p>
                    {isLinked && link?.provider_user_id && (
                      <p className="text-[10px] text-indigo-400 font-mono truncate">ID: {link.provider_user_id}</p>
                    )}
                  </div>

                  <div className="pt-3 mt-1 border-t border-white/5">
                    {isLinked ? (
                      <button
                        type="button"
                        onClick={() => {
                          setUnlinkingProvider(p.id);
                          setIsUnlinkConfirmOpen(true);
                        }}
                        className="w-full py-1.5 px-2.5 text-[11px] font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Link2Off className="w-3 h-3" />
                        <span>Disconnect</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleLink(p.id)}
                        className="w-full py-1.5 px-2.5 text-[11px] font-medium text-zinc-200 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-xs"
                      >
                        <Link2 className="w-3 h-3" />
                        <span>Connect</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={isUnlinkConfirmOpen}
        title={`Disconnect ${unlinkingProvider ? unlinkingProvider.charAt(0).toUpperCase() + unlinkingProvider.slice(1) : ''}?`}
        description="Are you sure you want to disconnect this account? You will no longer be able to use it to sign in unless your account has an active password."
        confirmText={isSubmitting ? 'Disconnecting...' : 'Disconnect Account'}
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmUnlink}
        onClose={() => {
          setIsUnlinkConfirmOpen(false);
          setUnlinkingProvider(null);
        }}
      />
    </>
  );
};
