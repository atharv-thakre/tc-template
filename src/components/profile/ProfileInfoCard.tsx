import React, { useState, useEffect } from 'react';
import { UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Account, PatchMeInput } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common/Card';
import { FormField } from '../common/FormField';
import { getErrorMessage } from '../../services/apiClient';

interface ProfileInfoCardProps {
  account: Account;
  onUpdateProfile: (input: PatchMeInput) => Promise<void>;
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({ account, onUpdateProfile }) => {
  const [profileName, setProfileName] = useState(account.name || '');
  const [profileEmail, setProfileEmail] = useState(account.email || '');
  const [profileHandle, setProfileHandle] = useState(account.handle || '');
  const [profilePhone, setProfilePhone] = useState(account.phone || '');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(account.avatar_url || '');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setProfileName(account.name || '');
    setProfileEmail(account.email || '');
    setProfileHandle(account.handle || '');
    setProfilePhone(account.phone || '');
    setProfileAvatarUrl(account.avatar_url || '');
  }, [account.id, account.name, account.email, account.handle, account.phone, account.avatar_url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await onUpdateProfile({
        name: profileName || undefined,
        email: profileEmail || undefined,
        handle: profileHandle || undefined,
        phone: profilePhone || null,
        avatar_url: profileAvatarUrl || null,
      });
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to update profile'));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-white/10 bg-[#0c0e15]/70 backdrop-blur-2xl ring-1 ring-white/5 shadow-xl rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base font-bold">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <span>Profile Information</span>
        </CardTitle>
        <CardDescription className="mt-1 text-xs text-zinc-400">
          Update your public profile, contact details, and display identity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name">
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full px-3.5 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all shadow-inner"
              />
            </FormField>
            <FormField label="Email Address">
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all shadow-inner"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Username / Handle">
              <input
                type="text"
                value={profileHandle}
                onChange={(e) => setProfileHandle(e.target.value)}
                placeholder="janedoe"
                className="w-full px-3.5 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all shadow-inner"
              />
            </FormField>
            <FormField label="Phone Number">
              <input
                type="tel"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full px-3.5 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all shadow-inner"
              />
            </FormField>
          </div>

          <FormField label="Avatar Image URL">
            <input
              type="url"
              value={profileAvatarUrl}
              onChange={(e) => setProfileAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-3.5 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all shadow-inner"
            />
          </FormField>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/20 active:scale-95"
            >
              {isUpdating ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
