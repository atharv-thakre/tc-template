import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Eye, EyeOff, Lock, User, AtSign, RotateCcw } from 'lucide-react';
import { authService } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '../../services/apiClient';

interface MagicLinkSignupPageProps {
  onNavigate: (path: string) => void;
}

const finishSignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  handle: z
    .string()
    .min(2, 'Handle must be at least 2 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Handle can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

type FinishSignupData = z.infer<typeof finishSignupSchema>;

export const MagicLinkSignupPage: React.FC<MagicLinkSignupPageProps> = ({ onNavigate }) => {
  const { refetchMe } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FinishSignupData>({
    resolver: zodResolver(finishSignupSchema),
    defaultValues: {
      name: '',
      handle: '',
      password: '',
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) {
      setErrorMsg(decodeURIComponent(err));
      return;
    }

    const emailParam = params.get('email') || '';
    const otpParam = params.get('otp') || '';

    setEmail(emailParam);
    setOtp(otpParam);

    if (emailParam) {
      const defaultHandle = emailParam.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15);
      const defaultName = emailParam.split('@')[0].charAt(0).toUpperCase() + emailParam.split('@')[0].slice(1);
      setValue('name', defaultName);
      setValue('handle', defaultHandle);
    }
  }, [setValue]);

  const onSubmit = async (data: FinishSignupData) => {
    if (!email || !otp) {
      toast.error('Missing verification tokens. Please restart registration.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.signupOTP({
        name: data.name,
        handle: data.handle,
        email,
        otp,
        password: data.password,
      });

      await refetchMe();
      toast.success('Account created successfully via Magic Link!');
      onNavigate('/profile');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to complete registration'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#0f121d]/90 border border-white/10 backdrop-blur-2xl rounded-2xl p-7 shadow-2xl">
        {/* Header Icon */}
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="text-center mb-5">
          <h2 className="text-xl font-bold text-white tracking-tight">Complete Registration</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Email verified via Magic Link. Fill in your profile details once to finish.
          </p>
        </div>

        {errorMsg ? (
          <div className="text-center space-y-4 py-2">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-rose-400">Registration Link Expired</h3>
            <p className="text-xs text-zinc-300 max-w-sm mx-auto">{errorMsg}</p>
            <button
              type="button"
              onClick={() => onNavigate('/signup')}
              className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <span>Back to Sign Up</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Locked Email Pill with Change Option */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-emerald-400 font-bold block tracking-wider uppercase">
                    LOCKED & VERIFIED EMAIL
                  </span>
                  <span className="font-medium truncate block text-white">{email || 'Verified Email'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/signup')}
                className="text-[10.5px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer shrink-0 ml-2 underline flex items-center gap-1"
                title="Change email and send new OTP"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Change</span>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="Jane Doe"
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {errors.name && <p className="text-[10px] text-rose-400 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Username / Handle</label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    {...register('handle')}
                    placeholder="janedoe"
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
                {errors.handle && <p className="text-[10px] text-rose-400 mt-1">{errors.handle.message}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Account Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-9 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-rose-400 mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/20 transition-all mt-4"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Finish Registration & Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
