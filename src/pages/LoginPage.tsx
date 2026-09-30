import React, { useState } from 'react';
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
import { AuthLeftShowcase } from '../components/auth/AuthLeftShowcase';
import { ServerSettingsButton } from '../components/auth/ServerSettingsButton';

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
      try {
        await loginOTP({ email: targetEmail, otp: code });
      } catch {
        await loginMagicLink({ email: targetEmail, otp: code });
      }
      setIsOtpAccepted(true);
      toast.success('Signed in successfully');
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
    if (!forgotPasswordInput || forgotPasswordInput.length < 6) {
      toast.error('New password must be at least 6 characters');
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
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to reset password'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#080a11] text-white relative overflow-x-hidden flex flex-col justify-between">
      {/* Background Cosmic Lighting & Grid */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Top-Left Blue/Purple Radial Glow */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[140px]" />
        {/* Bottom-Left Vibrant Cyan/Purple Cosmic Light Ray */}
        <div className="absolute -bottom-40 -left-20 w-[700px] h-[700px] bg-gradient-to-tr from-blue-600/25 via-indigo-600/20 to-purple-600/20 rounded-full blur-[160px]" />
        {/* Top-Right Ambient Dark Glow */}
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-purple-900/15 rounded-full blur-[150px]" />
        {/* Subtle Constellation Lines Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex-1 flex flex-col justify-center">
        {/* Mobile Header (Shown on small screens) */}
        <div className="lg:hidden flex items-center justify-between pb-6 select-none">
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

        {/* 2-Block Desktop Grid (1920x1080 alignment) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Block: Brand Showcase (Hidden on small mobile, visible on desktop) */}
          <div className="hidden lg:block lg:col-span-6 xl:col-span-7 pr-4">
            <AuthLeftShowcase />
          </div>

          {/* Right Block: Auth Card Form */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-center lg:items-end justify-center w-full">
            {/* Desktop Server Settings Pill (Top right above card) */}
            <div className="hidden lg:flex justify-end w-full max-w-[440px] mb-4">
              <ServerSettingsButton onClick={() => setIsConfigModalOpen(true)} />
            </div>

            {/* The Authentication Card */}
            <div className="w-full max-w-[440px] bg-[#0e111a]/90 border border-zinc-800/90 rounded-[28px] p-7 sm:p-9 shadow-2xl shadow-black/90 backdrop-blur-xl relative overflow-hidden transition-all">
              {/* Card Top Avatar Icon */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h2>
                <p className="text-xs text-zinc-400 mt-1">Sign in to continue to your account.</p>
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
                  <span className="bg-[#0e111a] px-3 text-zinc-400">OR SIGN IN WITH CREDENTIALS</span>
                </div>
              </div>

              {/* Mode Tabs */}
              <div className="relative flex p-1 mb-5 rounded-2xl bg-[#080a10] border border-zinc-800/90">
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
                        isEmail ? 'flex-[1.35]' : 'flex-1'
                      } py-2 px-1.5 text-[11px] sm:text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 z-10 select-none ${
                        isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeLoginTab"
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

              {/* Form Content */}
              <AnimatePresence mode="wait">
                {/* Tab 1: Password Form */}
                {tab === 'password' && (
                  <motion.form
                    key="password"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    onSubmit={handlePasswordFormSubmit}
                    noValidate={apiMode === 'demo'}
                    className="space-y-4"
                  >
                    {/* Identifier Field */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                        <span>EMAIL OR HANDLE</span>
                        <span className="text-rose-500 font-black">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="admin@tcauth.dev or atharv"
                          {...registerPassword('identifier')}
                          defaultValue={apiMode === 'demo' ? 'admin@tcauth.dev' : ''}
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#080a10] border border-zinc-800/90 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        />
                      </div>
                      {apiMode !== 'demo' && passwordErrors.identifier?.message && (
                        <p className="text-[11px] text-rose-400 mt-1">{passwordErrors.identifier.message}</p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                        <span>PASSWORD</span>
                        <span className="text-rose-500 font-black">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="At least 6 characters"
                          {...registerPassword('password')}
                          defaultValue={apiMode === 'demo' ? 'password123' : ''}
                          className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#080a10] border border-zinc-800/90 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {apiMode !== 'demo' && passwordErrors.password?.message && (
                        <p className="text-[11px] text-rose-400 mt-1">{passwordErrors.password.message}</p>
                      )}
                    </div>

                    {/* Forgot Password Link */}
                    <div className="flex justify-end pt-0.5">
                      <button
                        type="button"
                        onClick={() => setTab('reset')}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Primary Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:from-indigo-700 active:to-indigo-600 rounded-xl shadow-lg shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none mt-2"
                    >
                      {isLoading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{apiMode === 'demo' ? 'Sign In as SuperAdmin' : 'Sign In'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}

                {/* Tab 2: Email Magic Link & OTP */}
                {tab === 'email' && (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    {!emailAuthSent ? (
                      <form onSubmit={handleSendEmailAuth} noValidate={apiMode === 'demo'} className="space-y-4">
                        <div className="space-y-1.5 text-left">
                          <label className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                            <span>EMAIL ADDRESS</span>
                            <span className="text-rose-500 font-black">*</span>
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                            <input
                              type="email"
                              placeholder="user@example.com"
                              value={emailAuthInput}
                              onChange={(e) => setEmailAuthInput(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#080a10] border border-zinc-800/90 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSendingEmailAuth}
                          className="w-full py-3 px-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl shadow-lg shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none mt-2"
                        >
                          {isSendingEmailAuth ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Send Verification Code</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs text-zinc-400">
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

                        <form onSubmit={(e) => handleVerifyEmailAuthCode(e)} className="space-y-3">
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
                            <div className="flex justify-end -mt-1">
                              <button
                                type="button"
                                onClick={() => setEmailAuthCode('123456')}
                                className="text-[11px] font-mono text-amber-400/90 hover:text-amber-300 cursor-pointer"
                              >
                                Fill demo code: 123456
                              </button>
                            </div>
                          )}

                          {!isOtpAccepted && (
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="w-full py-3 px-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl shadow-lg shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none mt-2"
                            >
                              {isLoading ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <span>Verify & Sign In</span>
                                  <ArrowRight className="w-4 h-4" />
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
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    {!resetSent ? (
                      <form onSubmit={handleRequestResetOtp} noValidate={apiMode === 'demo'} className="space-y-4">
                        <div className="space-y-1.5 text-left">
                          <label className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                            <span>REGISTERED EMAIL</span>
                            <span className="text-rose-500 font-black">*</span>
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                            <input
                              type="email"
                              placeholder="user@example.com"
                              value={forgotEmail}
                              onChange={(e) => setForgotEmail(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#080a10] border border-zinc-800/90 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSendingReset}
                          className="w-full py-3 px-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl shadow-lg shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none mt-2"
                        >
                          {isSendingReset ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Send Reset Code</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs text-zinc-400">
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

                        <form onSubmit={handleForgotPassword} className="space-y-3">
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
                            <div className="flex justify-end -mt-1">
                              <button
                                type="button"
                                onClick={() => setForgotOtp('123456')}
                                className="text-[11px] font-mono text-amber-400/90 hover:text-amber-300 cursor-pointer"
                              >
                                Fill demo code: 123456
                              </button>
                            </div>
                          )}

                          {!isResetOtpAccepted && (
                            <>
                              <div className="space-y-1.5 text-left pt-1">
                                <label className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-1">
                                  <span>NEW PASSWORD</span>
                                  <span className="text-rose-500 font-black">*</span>
                                </label>
                                <div className="relative">
                                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                                  <input
                                    type={showResetPassword ? 'text' : 'password'}
                                    placeholder="At least 6 characters"
                                    value={forgotPasswordInput}
                                    onChange={(e) => setForgotPasswordInput(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#080a10] border border-zinc-800/90 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowResetPassword(!showResetPassword)}
                                    className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                                  >
                                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>

                              <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 px-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl shadow-lg shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none mt-2"
                              >
                                {isLoading ? (
                                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <span>Update & Sign In</span>
                                    <ArrowRight className="w-4 h-4" />
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
              <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center">
                <p className="text-xs text-zinc-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('/signup')}
                    className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer ml-1"
                  >
                    Create account
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Server Settings Modal */}
      <ApiConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
};
