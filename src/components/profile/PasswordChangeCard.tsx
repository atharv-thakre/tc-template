import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common/Card';
import { securityApi } from '../../services/securityApi';
import { getErrorMessage } from '../../services/apiClient';

const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

interface PasswordChangeCardProps {
  hasPassword?: boolean;
  onPasswordChanged?: () => void;
}

export const PasswordChangeCard: React.FC<PasswordChangeCardProps> = ({ hasPassword, onPasswordChanged }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmitPassword = async (data: UpdatePasswordFormData) => {
    setIsUpdating(true);
    try {
      const res = await securityApi.updatePassword({ password: data.password });
      toast.success(res?.message || 'Password updated successfully');
      reset();
      onPasswordChanged?.();
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to update password'));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-white/10 bg-[#0c0e15]/70 backdrop-blur-2xl ring-1 ring-white/5 shadow-xl rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base font-bold">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-inner">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <span>{hasPassword ? 'Change Password' : 'Set Initial Password'}</span>
        </CardTitle>
        <CardDescription className="mt-1 text-xs text-zinc-400">
          {hasPassword
            ? 'Update your existing password credentials to keep your account secure.'
            : 'Set an initial password to enable credential-based sign in alongside SSO.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-10 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] text-rose-400 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-10 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Password must be at least 6 characters and contain uppercase, lowercase, and numeric characters.
          </p>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/20 active:scale-95"
            >
              {isUpdating ? 'Updating...' : hasPassword ? 'Update Password' : 'Set Initial Password'}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
