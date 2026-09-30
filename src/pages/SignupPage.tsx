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
import LineWaves from '../components/reactbits/LineWaves';
import AccordionGallery from '../components/reactbits/AccordionGallery';
import { AUTH_ACCORDION_ITEMS } from '../config/accordionItems';

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
    <div className="h-screen max-h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden flex flex-col justify-between select-none">
      {/* LineWaves OGL Motion Background - Softer, smoother intensity */}
      <LineWaves
        speed={0.22}
        innerLineCount={32}
        outerLineCount={36}
        warpIntensity={0.8}
        rotation={-45}
        edgeFadeWidth={0}
        colorCycleSpeed={1}
        brightness={0.11}
        color1="#6366f1"
        color2="#818cf8"
        color3="#a5b4fc"
        enableMouseInteraction
        mouseInfluence={2}
      />

      {/* Subtle radial vignette overlay to blend background gracefully */}
      <div className="absolute inset-0 bg-radial-[at_50%_50%] from-transparent via-[var(--bg-primary)]/40 to-[var(--bg-primary)]/90 pointer-events-none z-0" />

      {/* Main Split Layout */}
      <div className="relative z-10 w-full flex-1 flex flex-col lg:flex-row h-full max-h-screen overflow-hidden">
        {/* Left Side: React Bits AccordionGallery (Expanded top, bottom, and right) */}
        <div className="hidden lg:flex lg:w-[60%] xl:w-[65%] 2xl:w-[68%] h-full relative items-center justify-center p-3 sm:p-4 lg:p-5 select-none overflow-hidden">
          <div className="w-full h-full relative flex items-center">
            <AccordionGallery
              items={AUTH_ACCORDION_ITEMS}
              defaultIndex={2}
              expandRatio={0.52}
              trigger="hover"
              accentColor="#818cf8"
              overlayColor="#07090e"
              textColor="#ffffff"
              grayscale={true}
              tilt={6}
              parallax={0.4}
              gap={10}
              radius={16}
              height="100%"
            />
          </div>
        </div>

        {/* Right Half: Centered Clean Auth Card Form */}
        <div className="w-full lg:w-[40%] xl:w-[35%] 2xl:w-[32%] h-full overflow-y-auto lg:overflow-hidden flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-2 relative">
          {/* Mobile Header (Shown on small screens) */}
          <div className="lg:hidden flex items-center justify-between w-full max-w-[400px] pb-2 select-none">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <KeyRound className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-white">tc-auth</span>
                <p className="text-[8px] text-zinc-400">Auth Engine</p>
              </div>
            </div>

            <ServerSettingsButton onClick={() => setIsConfigModalOpen(true)} />
          </div>

          {/* Desktop Header (Top above card) */}
          <div className="hidden lg:flex justify-between items-center w-full max-w-[400px] mb-1.5 select-none">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <KeyRound className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-white">tc-auth</span>
                <p className="text-[8px] text-zinc-400">Auth Engine</p>
              </div>
            </div>
            <ServerSettingsButton onClick={() => setIsConfigModalOpen(true)} />
          </div>

          {/* Beautifully Blended Glassmorphism Authentication Card */}
          <div className="w-full max-w-[400px] p-4 sm:p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] rounded-2xl border border-white/10 bg-[#0c0e15]/65 backdrop-blur-2xl relative ring-1 ring-white/5">
              {apiMode === 'demo' ? (
                /* Demo Mode Warning */
                <div className="text-center space-y-3 py-2 animate-in fade-in duration-200">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-extrabold text-white">Live Server Required</h2>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Account registration is disabled in Demo Mock Mode. Switch to Live Server mode to register new accounts.
                    </p>
                  </div>
                  <div className="pt-1 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setApiMode('live');
                        toast.success('Switched to Live Server mode');
                      }}
                      className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Switch to Live Server Mode</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('/login')}
                      className="w-full py-1.5 px-3 text-xs font-semibold text-zinc-300 hover:text-white bg-black/40 hover:bg-white/10 rounded-lg transition-all cursor-pointer border border-white/10 backdrop-blur-md"
                    >
                      Return to Sign In
                    </button>
                  </div>
                </div>
              ) : (
                /* Live Registration Form */
                <>
                  {/* Card Top Avatar Icon */}
                  <div className="text-center mb-2">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 text-zinc-200 flex items-center justify-center mx-auto mb-1 shadow-inner backdrop-blur-md">
                      <UserPlus className="w-4 h-4 text-zinc-200" />
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Create Account</h2>
                    <p className="text-[10.5px] text-zinc-400 mt-0.5">Get started with secure authentication.</p>
                  </div>

                  {/* SSO Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    <ProviderButton provider="google" short onSuccessNavigate={() => onNavigate('/profile')} />
                    <ProviderButton provider="github" short onSuccessNavigate={() => onNavigate('/profile')} />
                    <ProviderButton provider="discord" short onSuccessNavigate={() => onNavigate('/profile')} />
                  </div>

                  {/* Divider */}
                  <div className="relative my-1.5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-[8.5px] uppercase font-bold tracking-wider">
                      <span className="bg-[#0e1017]/85 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/5 text-zinc-400">
                        OR REGISTER WITH CREDENTIALS
                      </span>
                    </div>
                  </div>

                  {/* Mode Tabs */}
                  <div className="relative flex p-0.5 mb-2 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">
                    {(['password', 'email'] as const).map((t) => {
                      const isActive = tab === t;
                      const label = t === 'password' ? 'Direct Signup' : 'Verified (OTP)';
                      const Icon = t === 'password' ? KeyRound : Sparkles;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTab(t)}
                          className={`relative flex-1 py-1.5 px-1.5 text-[10.5px] font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 z-10 select-none min-w-0 ${
                            isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeSignupTab"
                              className="absolute inset-0 rounded-lg bg-white/[0.08] border border-white/15 -z-10 shadow-sm backdrop-blur-md"
                              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                            />
                          )}
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="whitespace-nowrap font-medium">{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence mode="wait">
                    {/* Tab 1: Direct Password Registration */}
                    {tab === 'password' && (
                      <motion.form
                        key="password"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.12 }}
                        onSubmit={handleSubmit(onSubmitPassword)}
                        className="space-y-1.5"
                      >
                        {/* Name */}
                        <div className="space-y-0.5 text-left">
                          <label className="text-[9.5px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                            <span>FULL NAME</span>
                            <span className="text-rose-500 font-black">*</span>
                          </label>
                          <div className="relative">
                            <User className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="John Doe"
                              {...register('name')}
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/35 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all shadow-inner"
                            />
                          </div>
                          {errors.name?.message && (
                            <p className="text-[9.5px] text-rose-400 mt-0.5">{errors.name.message}</p>
                          )}
                        </div>

                        {/* Username / Handle */}
                        <div className="space-y-0.5 text-left">
                          <label className="text-[9.5px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                            <span>USERNAME / HANDLE</span>
                            <span className="text-rose-500 font-black">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1.5 text-xs font-mono text-zinc-500 pointer-events-none">
                              @
                            </span>
                            <input
                              type="text"
                              placeholder="username"
                              {...register('handle')}
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/35 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all font-mono shadow-inner"
                            />
                          </div>
                          {errors.handle?.message && (
                            <p className="text-[9.5px] text-rose-400 mt-0.5">{errors.handle.message}</p>
                          )}
                        </div>

                        {/* Email */}
                        <div className="space-y-0.5 text-left">
                          <label className="text-[9.5px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                            <span>EMAIL ADDRESS</span>
                            <span className="text-rose-500 font-black">*</span>
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                            <input
                              type="email"
                              placeholder="user@example.com"
                              {...register('email')}
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/35 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all shadow-inner"
                            />
                          </div>
                          {errors.email?.message && (
                            <p className="text-[9.5px] text-rose-400 mt-0.5">{errors.email.message}</p>
                          )}
                        </div>

                        {/* Password */}
                        <div className="space-y-0.5 text-left">
                          <label className="text-[9.5px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                            <span>PASSWORD</span>
                            <span className="text-rose-500 font-black">*</span>
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="At least 6 characters"
                              {...register('password')}
                              className="w-full pl-8 pr-8 py-1.5 text-xs bg-black/35 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all shadow-inner"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                              title={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          {errors.password?.message && (
                            <p className="text-[9.5px] text-rose-400 mt-0.5">{errors.password.message}</p>
                          )}
                        </div>

                        {/* Primary Submit Button */}
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none mt-1.5 active:scale-[0.98]"
                        >
                          {isLoading ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Create Account</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </motion.form>
                    )}

                    {/* Tab 2: Verified Email OTP Registration */}
                    {tab === 'email' && (
                      <motion.div
                        key="email"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="space-y-2 text-left"
                      >
                        {isPreVerified && (
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10.5px] flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Email verified! Complete details to register.</span>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <div className="space-y-0.5 text-left">
                            <label className="text-[9.5px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                              <span>FULL NAME</span>
                              <span className="text-rose-500 font-black">*</span>
                            </label>
                            <div className="relative">
                              <User className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                              <input
                                type="text"
                                placeholder="John Doe"
                                {...register('name')}
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/35 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all shadow-inner"
                              />
                            </div>
                          </div>

                          <div className="space-y-0.5 text-left">
                            <label className="text-[9.5px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                              <span>USERNAME / HANDLE</span>
                              <span className="text-rose-500 font-black">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1.5 text-xs font-mono text-zinc-500 pointer-events-none">
                                @
                              </span>
                              <input
                                type="text"
                                placeholder="username"
                                {...register('handle')}
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/35 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all font-mono shadow-inner"
                              />
                            </div>
                          </div>

                          <div className="space-y-0.5 text-left">
                            <label className="text-[9.5px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                              <span>EMAIL ADDRESS</span>
                              <span className="text-rose-500 font-black">*</span>
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                              <input
                                type="email"
                                placeholder="user@example.com"
                                {...register('email')}
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/35 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all shadow-inner"
                              />
                            </div>
                          </div>

                          <div className="space-y-0.5 text-left">
                            <label className="text-[9.5px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                              <span>PASSWORD</span>
                              <span className="text-rose-500 font-black">*</span>
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                              <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="At least 6 characters"
                                {...register('password')}
                                className="w-full pl-8 pr-8 py-1.5 text-xs bg-black/35 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all shadow-inner"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                              >
                                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {!otpSent && !isPreVerified ? (
                          <button
                            type="button"
                            onClick={handleSendEmailAuth}
                            disabled={isSendingOtp}
                            className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none mt-1.5 active:scale-[0.98]"
                          >
                            {isSendingOtp ? (
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <span>Send Verification Code</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="space-y-2 pt-0.5">
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
                                className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none mt-1.5 active:scale-[0.98]"
                              >
                                {isLoading ? (
                                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <span>Complete Registration</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            )}

                            {!isPreVerified && !isOtpAccepted && (
                              <div className="pt-0.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleSendEmailAuth()}
                                  disabled={isSendingOtp}
                                  className="text-[10.5px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline disabled:opacity-50"
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
              <div className="mt-2 pt-2 border-t border-white/10 text-center">
                <p className="text-[10.5px] text-zinc-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('/login')}
                    className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer ml-0.5"
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
