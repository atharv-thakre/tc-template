import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RotateCcw,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';
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

const passwordSchema = z.object({
  identifier: z.string().min(1, 'Email or handle is required'),
  password: z.string().min(1, 'Password is required'),
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export const LoginPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { loginPassword, loginOTP, loginMagicLink, forgotPassword } = useAuth();
  const { apiMode } = useApiConfig();

  const [tab, setTab] = useState<'password' | 'email' | 'reset'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Email Magic Link & OTP Auth State
  const [emailAuthInput, setEmailAuthInput] = useState('');
  const [emailAuthCode, setEmailAuthCode] = useState('');
  const [emailAuthSent, setEmailAuthSent] = useState(false);
  const [isSendingEmailAuth, setIsSendingEmailAuth] = useState(false);
  const [isOtpAccepted, setIsOtpAccepted] = useState(false);

  // Forgot / Reset Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotPasswordInput, setForgotPasswordInput] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isResetOtpAccepted, setIsResetOtpAccepted] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const email = params.get('email');
      const otp = params.get('otp');

      if (pathname.includes('/reset-password') || params.get('purpose') === 'reset' || (otp && email && pathname.includes('reset'))) {
        setTab('reset');
        if (email) setForgotEmail(email);
        if (otp) {
          setForgotOtp(otp);
          setResetSent(true);
          toast.info('Reset code received via Magic Link. Enter your new password.');
        }
      } else if (otp && email) {
        setTab('email');
        setEmailAuthInput(email);
        setEmailAuthCode(otp);
        setEmailAuthSent(true);
      }
    }
  }, []);

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      await loginPassword(data);
      toast.success('Signed in successfully');
      onNavigate('/profile');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to sign in. Please check credentials or server connection.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiMode === 'demo') {
      setIsLoading(true);
      try {
        await loginPassword({
          identifier: 'admin@tcauth.dev',
          password: 'password123',
        });
        toast.success('Signed in as SuperAdmin in Demo Mode');
        onNavigate('/profile');
      } catch (err: any) {
        toast.error(getErrorMessage(err, 'Failed to sign in as demo superadmin'));
      } finally {
        setIsLoading(false);
      }
      return;
    }
    handleSubmitPassword(onSubmitPassword)(e);
  };

  const handleSendEmailAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const emailToUse = (emailAuthInput || '').trim() || (apiMode === 'demo' ? 'admin@tcauth.dev' : '');
    if (!emailToUse) {
      toast.error('Please enter your email address');
      return;
    }
    if (!emailAuthInput?.trim()) {
      setEmailAuthInput(emailToUse);
    }
    setIsSendingEmailAuth(true);
    try {
      if (apiMode === 'demo') {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setEmailAuthSent(true);
        setIsOtpAccepted(false);
        toast.success('Verification code sent to your email (Demo Mode)');
      } else {
        const frontendUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
        await authService.sendEmailOTP('login', { email: emailToUse, frontend_url: frontendUrl });
        setEmailAuthSent(true);
        setIsOtpAccepted(false);
        toast.success('Magic Link & 6-digit OTP code sent to your email.');
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to send verification email.'));
    } finally {
      setIsSendingEmailAuth(false);
    }
  };

  const handleVerifyEmailAuthCode = async (e?: React.FormEvent, codeOverride?: string) => {
    if (e) e.preventDefault();
    const code = (codeOverride !== undefined ? codeOverride : emailAuthCode).trim();
    if (!code || code.length < 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }
    const targetEmail = (emailAuthInput || '').trim() || (apiMode === 'demo' ? 'admin@tcauth.dev' : '');
    if (!targetEmail) {
      toast.error('Please enter your email address');
      return;
    }
    setIsLoading(true);
    try {
      await loginOTP({ email: targetEmail, otp: code });
      setIsOtpAccepted(true);
      toast.success('Signed in successfully');
      onNavigate('/profile');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Invalid or expired verification code.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestResetOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotEmail?.trim()) {
      toast.error('Please enter your registered email');
      return;
    }
    setIsSendingReset(true);
    try {
      if (apiMode === 'demo') {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setResetSent(true);
        setIsResetOtpAccepted(false);
        toast.success('Password reset instructions sent (Demo Mode)');
      } else {
        await authService.sendEmailOTP('reset', { email: forgotEmail.trim() });
        setResetSent(true);
        setIsResetOtpAccepted(false);
        toast.success('Password reset code sent to your email.');
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to send password reset code'));
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail?.trim()) {
      toast.error('Please enter your registered email');
      return;
    }
    if (!forgotOtp?.trim() || forgotOtp.length < 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }
    const passwordPolicyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordPolicyRegex.test(forgotPasswordInput)) {
      toast.error('Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }
    setIsLoading(true);
    try {
      await forgotPassword({
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        password: forgotPasswordInput,
      });
      setIsResetOtpAccepted(true);
      toast.success('Password updated successfully! Signing you in...');
      onNavigate('/profile');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to reset password'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden flex flex-col justify-between">
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

      {/* Main Split Layout - Perfectly fits 100vh with 0 scroll */}
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
            {/* Card Top Avatar Icon */}
            <div className="text-center mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 text-zinc-200 flex items-center justify-center mx-auto mb-1 shadow-inner backdrop-blur-md">
                <User className="w-4 h-4 text-zinc-200" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Welcome Back</h2>
              <p className="text-[10.5px] text-zinc-400 mt-0.5">Sign in to continue to your account.</p>
            </div>

            {/* SSO Buttons */}
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              <ProviderButton provider="google" short onSuccessNavigate={() => onNavigate('/profile')} />
              <ProviderButton provider="github" short onSuccessNavigate={() => onNavigate('/profile')} />
              <ProviderButton provider="discord" short onSuccessNavigate={() => onNavigate('/profile')} />
            </div>

            {/* Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[8.5px] uppercase font-bold tracking-wider">
                <span className="bg-[#0e1017]/85 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/5 text-zinc-400">
                  OR SIGN IN WITH CREDENTIALS
                </span>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="relative flex p-0.5 mb-2.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">
              {(['password', 'email', 'reset'] as const).map((t) => {
                const isActive = tab === t;
                const isEmail = t === 'email';
                const label =
                  t === 'password' ? 'Password' : t === 'email' ? 'Magic Link & OTP' : 'Reset';
                const Icon = t === 'password' ? KeyRound : t === 'email' ? Sparkles : RotateCcw;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`relative ${
                      isEmail ? 'flex-[1.25]' : 'flex-1'
                    } py-1.5 px-1 text-[10.5px] font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 z-10 select-none ${
                      isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeLoginTab"
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

            {/* Form Content */}
            <AnimatePresence mode="wait">
              {/* Tab 1: Password Form */}
              {tab === 'password' && (
                <motion.form
                  key="password"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  onSubmit={handlePasswordFormSubmit}
                  noValidate={apiMode === 'demo'}
                  className="space-y-2"
                >
                    {/* Identifier Field */}
                    <div className="space-y-0.5 text-left">
                      <label className="text-[9.5px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                        <span>EMAIL OR HANDLE</span>
                        <span className="text-rose-500 font-black">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="admin@tcauth.dev or atharv"
                          {...registerPassword('identifier')}
                          defaultValue={apiMode === 'demo' ? 'admin@tcauth.dev' : ''}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/35 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all shadow-inner"
                        />
                      </div>
                      {apiMode !== 'demo' && passwordErrors.identifier?.message && (
                        <p className="text-[9.5px] text-rose-400 mt-0.5">{passwordErrors.identifier.message}</p>
                      )}
                    </div>

                    {/* Password Field */}
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
                          {...registerPassword('password')}
                          defaultValue={apiMode === 'demo' ? 'password123' : ''}
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
                      {apiMode !== 'demo' && passwordErrors.password?.message && (
                        <p className="text-[9.5px] text-rose-400 mt-0.5">{passwordErrors.password.message}</p>
                      )}
                    </div>

                    {/* Forgot Password Link */}
                    <div className="flex justify-end pt-0">
                      <button
                        type="button"
                        onClick={() => setTab('reset')}
                        className="text-[10.5px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Solid Primary Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none mt-1 active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{apiMode === 'demo' ? 'Sign In as SuperAdmin' : 'Sign In'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}

                {/* Tab 2: Email Magic Link & OTP */}
                {tab === 'email' && (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="space-y-2.5"
                  >
                    {!emailAuthSent ? (
                      <form onSubmit={handleSendEmailAuth} noValidate={apiMode === 'demo'} className="space-y-2.5">
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
                              value={emailAuthInput}
                              onChange={(e) => setEmailAuthInput(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/35 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all shadow-inner"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSendingEmailAuth}
                          className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none mt-1 active:scale-[0.98]"
                        >
                          {isSendingEmailAuth ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Send Verification Code</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span>
                            Sent to <span className="font-semibold text-zinc-200">{emailAuthInput}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEmailAuthSent(false);
                              setIsOtpAccepted(false);
                            }}
                            className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
                          >
                            Change
                          </button>
                        </div>

                        <form onSubmit={(e) => handleVerifyEmailAuthCode(e)} className="space-y-2">
                          <FoldingOtpInput
                            value={emailAuthCode}
                            onChange={setEmailAuthCode}
                            length={6}
                            isSuccess={isOtpAccepted}
                            disabled={isLoading}
                            accentColor="indigo"
                            successTitle="Verified successfully"
                            successSubtitle="Your login code has been accepted."
                            onSuccessComplete={() => onNavigate('/profile')}
                            onComplete={(code) => handleVerifyEmailAuthCode(undefined, code)}
                          />

                          {apiMode === 'demo' && !isOtpAccepted && (
                            <div className="flex justify-end -mt-0.5">
                              <button
                                type="button"
                                onClick={() => setEmailAuthCode('123456')}
                                className="text-[10px] font-mono text-amber-400/90 hover:text-amber-300 cursor-pointer"
                              >
                                Fill demo code: 123456
                              </button>
                            </div>
                          )}

                          {!isOtpAccepted && (
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none mt-1 active:scale-[0.98]"
                            >
                              {isLoading ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <span>Verify & Sign In</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          )}
                        </form>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Tab 3: Reset Password */}
                {tab === 'reset' && (
                  <motion.div
                    key="reset"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="space-y-2.5"
                  >
                    {!resetSent ? (
                      <form onSubmit={handleRequestResetOtp} noValidate={apiMode === 'demo'} className="space-y-2.5">
                        <div className="space-y-0.5 text-left">
                          <label className="text-[9.5px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                            <span>REGISTERED EMAIL</span>
                            <span className="text-rose-500 font-black">*</span>
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                            <input
                              type="email"
                              placeholder="user@example.com"
                              value={forgotEmail}
                              onChange={(e) => setForgotEmail(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/35 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all shadow-inner"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSendingReset}
                          className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none mt-1 active:scale-[0.98]"
                        >
                          {isSendingReset ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Send Reset Code</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span>
                            Code sent to <span className="font-semibold text-zinc-200">{forgotEmail}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setResetSent(false);
                              setIsResetOtpAccepted(false);
                            }}
                            className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
                          >
                            Change
                          </button>
                        </div>

                        <form onSubmit={handleForgotPassword} className="space-y-2">
                          <FoldingOtpInput
                            value={forgotOtp}
                            onChange={setForgotOtp}
                            length={6}
                            isSuccess={isResetOtpAccepted}
                            disabled={isLoading}
                            accentColor="indigo"
                            successTitle="Password Reset Successfully"
                            successSubtitle="Your new password has been verified."
                            onSuccessComplete={() => onNavigate('/profile')}
                          />

                          {apiMode === 'demo' && !isResetOtpAccepted && (
                            <div className="flex justify-end -mt-0.5">
                              <button
                                type="button"
                                onClick={() => setForgotOtp('123456')}
                                className="text-[10px] font-mono text-amber-400/90 hover:text-amber-300 cursor-pointer"
                              >
                                Fill demo code: 123456
                              </button>
                            </div>
                          )}

                          {!isResetOtpAccepted && (
                            <>
                              <div className="space-y-0.5 text-left pt-1">
                                <label className="text-[9.5px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                                  <span>NEW PASSWORD</span>
                                  <span className="text-rose-500 font-black">*</span>
                                </label>
                                <div className="relative">
                                  <Lock className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                                  <input
                                    type={showResetPassword ? 'text' : 'password'}
                                    placeholder="At least 6 characters"
                                    value={forgotPasswordInput}
                                    onChange={(e) => setForgotPasswordInput(e.target.value)}
                                    className="w-full pl-8 pr-8 py-1.5 text-xs bg-black/35 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all shadow-inner"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowResetPassword(!showResetPassword)}
                                    className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                                  >
                                    {showResetPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>

                              <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none mt-1 active:scale-[0.98]"
                              >
                                {isLoading ? (
                                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <span>Update & Sign In</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </form>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Switch to Register */}
              <div className="mt-2.5 pt-2 border-t border-white/10 text-center">
                <p className="text-[11px] text-zinc-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('/signup')}
                    className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer ml-1"
                  >
                    Create account
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
