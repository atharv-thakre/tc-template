import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Sparkles,
  User,
  UserPlus,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useApiConfig } from '../contexts/ApiConfigContext';
import { authService } from '../services/auth';
import { ProviderButton } from '../components/common/ProviderButton';
import { FoldingOtpInput } from '../components/FoldingOtpInput';
import { getErrorMessage } from '../services/apiClient';
import { ApiConfigModal } from '../components/common/ApiConfigModal';
import { ServerSettingsButton } from '../components/auth/ServerSettingsButton';
import { SITE_VERSION_LABEL } from '../config/version';
import { DecryptedText } from '../components/reactbits/DecryptedText';
import InfiniteMenu from '../components/InfiniteMenu/InfiniteMenu';

const tcAuthMenuItems = [
  {
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&h=600&fit=crop&sat=-100&auto=format',
    link: '#',
    title: 'Password',
    description: 'Secure credential authentication',
  },
  {
    image:
      'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?q=80&w=600&h=600&fit=crop&sat=-100&auto=format',
    link: '#',
    title: 'Passwordless',
    description: 'Magic links and OTP verification',
  },
  {
    image:
      'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=600&h=600&fit=crop&sat=-100&auto=format',
    link: '#',
    title: 'OAuth',
    description: 'Google, GitHub and Discord',
  },
  {
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&h=600&fit=crop&sat=-100&auto=format',
    link: '#',
    title: 'Sessions',
    description: 'Secure account and session control',
  },
];

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  handle: z
    .string()
    .min(2, 'Handle must be at least 2 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Handle can only contain letters, numbers, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export const SignupPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { signupPassword, signupOTP } = useAuth();
  const { apiMode, setApiMode } = useApiConfig();

  const [tab, setTab] = useState<'password' | 'email'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreVerified, setIsPreVerified] = useState(false);
  const [isOtpAccepted, setIsOtpAccepted] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const formValues = watch();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      const otpParam = params.get('otp');
      const verifiedParam = params.get('verified');
      if (emailParam) {
        setValue('email', emailParam);
      }
      if (otpParam) {
        setOtpCode(otpParam);
        setOtpSent(true);
        setTab('email');
      }
      if (verifiedParam === 'true') {
        setIsPreVerified(true);
        setTab('email');
        toast.success('Email pre-verified via Magic Link! Fill in your details to finish registration.');
      }
    }
  }, [setValue]);

  const onSubmitPassword = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await signupPassword(data);
      toast.success('Account created successfully');
      onNavigate('/profile');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to create account. Please check details or server connection.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmailAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formValues.name?.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!formValues.handle?.trim()) {
      toast.error('Please enter your handle / username');
      return;
    }
    if (!formValues.email?.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!formValues.password || formValues.password.length < 6) {
      toast.error('Please set an account password (at least 6 characters)');
      return;
    }
    setIsSendingOtp(true);
    try {
      const frontendUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      await authService.sendEmailOTP('signup', { email: formValues.email.trim(), frontend_url: frontendUrl });
      setOtpSent(true);
      toast.success('Verification link & 6-digit code sent to your email.');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to send OTP verification email.'));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyAndSignupOtp = async (e?: React.FormEvent, codeOverride?: string) => {
    if (e) e.preventDefault();
    const code = (codeOverride !== undefined ? codeOverride : otpCode).trim();
    if (!isPreVerified && !code) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }
    if (!formValues.name?.trim() || !formValues.handle?.trim() || !formValues.email?.trim() || !formValues.password) {
      toast.error('Please fill in all registration fields including password');
      return;
    }
    setIsLoading(true);
    try {
      await signupOTP({
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        handle: formValues.handle.trim(),
        password: formValues.password,
        otp: code || 'magic_link_verified',
      });
      setIsOtpAccepted(true);
      toast.success('Email verified and account created successfully');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to complete signup.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#080a11] text-white relative overflow-x-hidden flex flex-col justify-between">
      {/* Background Cosmic Lighting & Grid */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -left-20 w-[700px] h-[700px] bg-gradient-to-tr from-blue-600/25 via-indigo-600/20 to-purple-600/20 rounded-full blur-[160px]" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-purple-900/15 rounded-full blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Main Split Layout */}
      <div className="relative z-10 w-full flex-1 flex flex-col lg:flex-row min-h-screen">
        {/* Left Half: Full-Bleed InfiniteMenu covering entire left side of screen */}
        <div className="hidden lg:block lg:w-[50%] xl:w-[54%] min-h-screen relative overflow-hidden bg-transparent">
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <InfiniteMenu items={tcAuthMenuItems} scale={1.25} />
          </div>
        </div>

        {/* Right Half: Centered Auth Card Form */}
        <div className="w-full lg:w-[50%] xl:w-[46%] min-h-screen flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 py-8 relative">
          {/* Mobile Header (Shown on small screens) */}
          <div className="lg:hidden flex items-center justify-between w-full max-w-[440px] pb-6 select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white">tc-auth</span>
                <p className="text-[10px] text-zinc-400">Auth Engine</p>
              </div>
            </div>

            <ServerSettingsButton onClick={() => setIsConfigModalOpen(true)} />
          </div>

          {/* Desktop Server Settings Pill (Top right above card) */}
          <div className="hidden lg:flex justify-end w-full max-w-[440px] mb-4">
            <ServerSettingsButton onClick={() => setIsConfigModalOpen(true)} />
          </div>

          {/* The Authentication Card */}
          <div className="w-full max-w-[440px] bg-[#0e111a]/90 border border-zinc-800/90 rounded-[28px] p-7 sm:p-9 shadow-2xl shadow-black/90 backdrop-blur-xl relative overflow-hidden transition-all">
              {apiMode === 'demo' ? (
                /* Demo Mode Warning */
                <div className="text-center space-y-5 py-4 animate-in fade-in duration-200">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-2xl font-extrabold text-white">Live Server Required</h2>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Account registration is disabled in Demo Mock Mode. Switch to Live Server mode to register new accounts.
                    </p>
                  </div>
                  <div className="pt-2 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setApiMode('live');
                        toast.success('Switched to Live Server mode');
                      }}
                      className="w-full py-3 px-4 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl shadow-lg shadow-indigo-600/35 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Switch to Live Server Mode</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('/login')}
                      className="w-full py-2.5 px-4 text-xs font-semibold text-zinc-400 hover:text-white bg-[#080a10] hover:bg-zinc-800/80 rounded-xl transition-all cursor-pointer border border-zinc-800"
                    >
                      Return to Sign In
                    </button>
                  </div>
                </div>
              ) : (
                /* Live Registration Form */
                <>
                  {/* Card Top Avatar Icon */}
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">Create Account</h2>
                    <p className="text-xs text-zinc-400 mt-1">Get started with secure authentication.</p>
                  </div>

                  {/* SSO Buttons */}
                  <div className="grid grid-cols-3 gap-2.5 mb-5">
                    <ProviderButton provider="google" short onSuccessNavigate={() => onNavigate('/profile')} />
                    <ProviderButton provider="github" short onSuccessNavigate={() => onNavigate('/profile')} />
                    <ProviderButton provider="discord" short onSuccessNavigate={() => onNavigate('/profile')} />
                  </div>

                  {/* Divider */}
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-800/90" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                      <span className="bg-[#0e111a] px-3 text-zinc-400">OR REGISTER WITH CREDENTIALS</span>
                    </div>
                  </div>

                  {/* Mode Tabs */}
                  <div className="relative flex p-1 mb-5 rounded-2xl bg-[#080a10] border border-zinc-800/90">
                    {(['password', 'email'] as const).map((t) => {
                      const isActive = tab === t;
                      const label = t === 'password' ? 'Direct Signup' : 'Verified (OTP)';
                      const Icon = t === 'password' ? KeyRound : Sparkles;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTab(t)}
                          className={`relative flex-1 py-2 px-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 z-10 select-none min-w-0 ${
                            isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeSignupTab"
                              className="absolute inset-0 rounded-xl bg-indigo-600 shadow-md shadow-indigo-600/30 -z-10"
                              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                            />
                          )}
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="whitespace-nowrap">{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence mode="wait">
                    {/* Tab 1: Direct Password Registration */}
                    {tab === 'password' && (
                      <motion.form
                        key="password"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        onSubmit={handleSubmit(onSubmitPassword)}
                        className="space-y-3.5"
                      >
                        {/* Name */}
                        <div className="space-y-1 text-left">
                          <label className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                            <span>FULL NAME</span>
                            <span className="text-rose-500 font-black">*</span>
                          </label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="John Doe"
                              {...register('name')}
                              className="w-full pl-10 pr-4 py-2 text-sm bg-[#080a10] border border-zinc-800/90 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            />
                          </div>
                          {errors.name?.message && (
                            <p className="text-[11px] text-rose-400 mt-1">{errors.name.message}</p>
                          )}
                        </div>

                        {/* Username / Handle */}
                        <div className="space-y-1 text-left">
                          <label className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                            <span>USERNAME / HANDLE</span>
                            <span className="text-rose-500 font-black">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-2.5 text-sm font-mono text-zinc-500 pointer-events-none">
                              @
                            </span>
                            <input
                              type="text"
                              placeholder="username"
                              {...register('handle')}
                              className="w-full pl-9 pr-4 py-2 text-sm bg-[#080a10] border border-zinc-800/90 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono text-xs"
                            />
                          </div>
                          {errors.handle?.message && (
                            <p className="text-[11px] text-rose-400 mt-1">{errors.handle.message}</p>
                          )}
                        </div>

                        {/* Email */}
                        <div className="space-y-1 text-left">
                          <label className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                            <span>EMAIL ADDRESS</span>
                            <span className="text-rose-500 font-black">*</span>
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                            <input
                              type="email"
                              placeholder="user@example.com"
                              {...register('email')}
                              className="w-full pl-10 pr-4 py-2 text-sm bg-[#080a10] border border-zinc-800/90 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            />
                          </div>
                          {errors.email?.message && (
                            <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>
                          )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1 text-left">
                          <label className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                            <span>PASSWORD</span>
                            <span className="text-rose-500 font-black">*</span>
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="At least 6 characters"
                              {...register('password')}
                              className="w-full pl-10 pr-10 py-2 text-sm bg-[#080a10] border border-zinc-800/90 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                              title={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {errors.password?.message && (
                            <p className="text-[11px] text-rose-400 mt-1">{errors.password.message}</p>
                          )}
                        </div>

                        {/* Primary Submit Button */}
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-3 px-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl shadow-lg shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none mt-4"
                        >
                          {isLoading ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Create Account</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </motion.form>
                    )}

                    {/* Tab 2: Verified Email OTP Registration */}
                    {tab === 'email' && (
                      <motion.div
                        key="email"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-3.5"
                      >
                        {isPreVerified && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Email verified! Complete details to register.</span>
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="space-y-1 text-left">
                            <label className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                              <span>FULL NAME</span>
                              <span className="text-rose-500 font-black">*</span>
                            </label>
                            <div className="relative">
                              <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                              <input
                                type="text"
                                placeholder="John Doe"
                                {...register('name')}
                                className="w-full pl-10 pr-4 py-2 text-sm bg-[#080a10] border border-zinc-800/90 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                              />
                            </div>
                          </div>

                          <div className="space-y-1 text-left">
                            <label className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                              <span>USERNAME / HANDLE</span>
                              <span className="text-rose-500 font-black">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-2.5 text-sm font-mono text-zinc-500 pointer-events-none">
                                @
                              </span>
                              <input
                                type="text"
                                placeholder="username"
                                {...register('handle')}
                                className="w-full pl-9 pr-4 py-2 text-sm bg-[#080a10] border border-zinc-800/90 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono text-xs"
                              />
                            </div>
                          </div>

                          <div className="space-y-1 text-left">
                            <label className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                              <span>EMAIL ADDRESS</span>
                              <span className="text-rose-500 font-black">*</span>
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                              <input
                                type="email"
                                placeholder="user@example.com"
                                {...register('email')}
                                className="w-full pl-10 pr-4 py-2 text-sm bg-[#080a10] border border-zinc-800/90 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                              />
                            </div>
                          </div>

                          <div className="space-y-1 text-left">
                            <label className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                              <span>PASSWORD</span>
                              <span className="text-rose-500 font-black">*</span>
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                              <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="At least 6 characters"
                                {...register('password')}
                                className="w-full pl-10 pr-10 py-2 text-sm bg-[#080a10] border border-zinc-800/90 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {!otpSent && !isPreVerified ? (
                          <button
                            type="button"
                            onClick={handleSendEmailAuth}
                            disabled={isSendingOtp}
                            className="w-full py-3 px-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl shadow-lg shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none mt-3"
                          >
                            {isSendingOtp ? (
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <span>Send Verification Code</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="space-y-3 pt-2">
                            {!isPreVerified && (
                              <FoldingOtpInput
                                value={otpCode}
                                onChange={setOtpCode}
                                length={6}
                                isSuccess={isOtpAccepted}
                                disabled={isLoading}
                                successTitle="Verified successfully"
                                successSubtitle="Your email has been verified."
                                onSuccessComplete={() => onNavigate('/profile')}
                                onComplete={(fullCode) => {
                                  if (formValues.name && formValues.handle && formValues.email && formValues.password) {
                                    handleVerifyAndSignupOtp(undefined, fullCode);
                                  }
                                }}
                              />
                            )}

                            {!isOtpAccepted && (
                              <button
                                type="button"
                                onClick={() => handleVerifyAndSignupOtp()}
                                disabled={isLoading}
                                className="w-full py-3 px-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl shadow-lg shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none mt-3"
                              >
                                {isLoading ? (
                                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <span>Complete Registration</span>
                                    <ArrowRight className="w-4 h-4" />
                                  </>
                                )}
                              </button>
                            )}

                            {!isPreVerified && !isOtpAccepted && (
                              <div className="pt-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleSendEmailAuth()}
                                  disabled={isSendingOtp}
                                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline disabled:opacity-50"
                                >
                                  {isSendingOtp ? 'Resending...' : "Didn't receive code? Resend"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {/* Bottom Switch to Login */}
              <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center">
                <p className="text-xs text-zinc-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('/login')}
                    className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer ml-1"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Server Settings Modal */}
        <ApiConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onNavigateToLogin={() => onNavigate('/login')}
        />
      </div>
    );
  };
