import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export interface FoldingOtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  isSuccess?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  accentColor?: 'indigo' | 'amber';
  successTitle?: string;
  successSubtitle?: string;
  onSuccessComplete?: () => void;
  onComplete?: (code: string) => void;
}

export const FoldingOtpInput: React.FC<FoldingOtpInputProps> = ({
  value = '',
  onChange,
  length = 6,
  isSuccess = false,
  disabled = false,
  autoFocus = false,
  accentColor = 'indigo',
  successTitle = 'Verified successfully',
  successSubtitle = 'Your 6-digit code has been verified and accepted.',
  onSuccessComplete,
  onComplete,
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Animation phase for the folding sequence: 'idle' -> 'folding' -> 'collapsing' -> 'success'
  const [animPhase, setAnimPhase] = useState<'idle' | 'folding' | 'collapsing' | 'success'>('idle');

  const digits = Array.from({ length }, (_, i) => value[i] || '');

  // Initialize input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Handle autoFocus
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Handle triggered success animation
  useEffect(() => {
    if (isSuccess && animPhase === 'idle') {
      // Step 1: Start folding into 2x3 grid
      setAnimPhase('folding');

      // Step 2: Collapse inward to center
      const collapseTimer = setTimeout(() => {
        setAnimPhase('collapsing');
      }, 550);

      // Step 3: Reveal success checkmark box and "Verified successfully"
      const successTimer = setTimeout(() => {
        setAnimPhase('success');
      }, 950);

      // Step 4: After a brief showcase, invoke onSuccessComplete if provided
      const completeTimer = setTimeout(() => {
        if (onSuccessComplete) {
          onSuccessComplete();
        }
      }, 2600);

      return () => {
        clearTimeout(collapseTimer);
        clearTimeout(successTimer);
        clearTimeout(completeTimer);
      };
    } else if (!isSuccess && animPhase !== 'idle') {
      setAnimPhase('idle');
    }
  }, [isSuccess, animPhase, onSuccessComplete]);

  // Handle keyboard inputs per box
  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || animPhase !== 'idle') return;
    const rawVal = e.target.value;

    // If all digits are already filled and user typed an extra digit, treat as mistake (do not alter)
    if (value.length >= length && index === length - 1 && digits[index]) {
      return;
    }

    // Handle paste or multi-character input
    if (rawVal.length > 1) {
      // If we are at the last box and already full, ignore extra character
      if (index === length - 1 && digits[index]) {
        return;
      }

      // If it's a multi-digit paste/autofill
      const cleanDigits = rawVal.replace(/\D/g, '');
      if (cleanDigits.length >= 4) {
        const sliced = cleanDigits.slice(0, length);
        onChange(sliced);
        const nextIdx = Math.min(sliced.length, length - 1);
        inputRefs.current[nextIdx]?.focus();
        if (sliced.length === length && onComplete) {
          onComplete(sliced);
        }
        return;
      }

      // If user typed a new character over an existing filled box, update just that box
      const lastChar = rawVal.slice(-1).replace(/\D/g, '');
      if (lastChar) {
        const currentChars = Array.from({ length }, (_, i) => value[i] || '');
        currentChars[index] = lastChar;
        const newCombined = currentChars.join('').trimEnd();
        onChange(newCombined);
        if (index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        }
        if (newCombined.length === length && onComplete) {
          onComplete(newCombined);
        }
      }
      return;
    }

    const digit = rawVal.replace(/\D/g, '');
    const currentChars = Array.from({ length }, (_, i) => value[i] || '');
    currentChars[index] = digit;
    const newCombined = currentChars.join('').trimEnd();

    onChange(newCombined);

    // If user typed a digit, advance to next box
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger onComplete when all digits are filled
    if (newCombined.length === length && onComplete) {
      onComplete(newCombined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || animPhase !== 'idle') return;

    // Prevent typing a 7th digit when all 6 boxes are already full
    if (/^[0-9]$/.test(e.key)) {
      if (index === length - 1 && digits[index] && value.length >= length) {
        e.preventDefault();
        return;
      }
    }

    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back to previous box and clear it
        inputRefs.current[index - 1]?.focus();
        const currentChars = Array.from({ length }, (_, i) => value[i] || '');
        currentChars[index - 1] = '';
        onChange(currentChars.join('').trimEnd());
        e.preventDefault();
      } else if (digits[index]) {
        // Clear current box without jumping back
        const currentChars = Array.from({ length }, (_, i) => value[i] || '');
        currentChars[index] = '';
        onChange(currentChars.join('').trimEnd());
        e.preventDefault();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled || animPhase !== 'idle') return;
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const cleanDigits = pasteData.replace(/\D/g, '').slice(0, length);
    if (cleanDigits) {
      onChange(cleanDigits);
      const nextIdx = Math.min(cleanDigits.length, length - 1);
      inputRefs.current[nextIdx]?.focus();
      if (cleanDigits.length === length && onComplete) {
        onComplete(cleanDigits);
      }
    }
  };

  // Pre-calculate folding positions for 6 digits:
  // In row of 6: 0, 1, 2, 3, 4, 5
  // When folding into 2 rows of 3:
  // Row 1: [0, 1, 2]
  // Row 2: [3, 4, 5]
  // The spacing step S ~ 52px (box 42px + gap 10px)
  const getBoxAnimation = (index: number) => {
    if (animPhase === 'idle') {
      return {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        rotate: 0,
      };
    }

    if (animPhase === 'folding') {
      // In 6-digit setup:
      // Row 1 (indexes 0, 1, 2) slide right & up
      // Row 2 (indexes 3, 4, 5) slide left & down
      const isTopRow = index < 3;
      const xOffset = isTopRow ? 78 : -78;
      const yOffset = isTopRow ? -32 : 32;

      return {
        x: xOffset,
        y: yOffset,
        scale: 0.98,
        opacity: 1,
        rotate: isTopRow ? -3 : 3,
        transition: {
          type: 'spring' as const,
          stiffness: 300,
          damping: 24,
        },
      };
    }

    // 'collapsing' or 'success'
    // All 6 boxes fold into the center (x: 0, y: 0), rotate and shrink into nothing
    return {
      x: 0,
      y: 0,
      scale: 0.15,
      opacity: 0,
      rotate: (index - 2.5) * 15,
      transition: {
        duration: 0.38,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    };
  };

  return (
    <div className="w-full select-none py-0.5">
      <AnimatePresence mode="wait">
        {animPhase === 'success' ? (
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-zinc-950/80 border border-emerald-500/30 shadow-[0_0_35px_rgba(16,185,129,0.12)] space-y-3 my-0.5"
          >
            {/* Success title */}
            <div className="space-y-1">
              <motion.h4
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="text-base sm:text-lg font-bold text-emerald-400 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                {successTitle}
              </motion.h4>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.14 }}
                className="text-xs text-zinc-400 max-w-xs mx-auto"
              >
                {successSubtitle}
              </motion.p>
            </div>

            {/* Glowing single center square with animated checkmark */}
            <div className="relative my-1">
              {/* Outer pulsing ripple ring */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0.7 }}
                animate={{ scale: [1, 1.4, 1.6], opacity: [0.6, 0.2, 0] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }}
                className="absolute -inset-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 -z-10 pointer-events-none"
              />

              {/* Center green box */}
              <motion.div
                initial={{ scale: 0.4, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-950/90 border-2 border-emerald-400/90 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]"
              >
                <svg
                  className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M20 6L9 17L4 12"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.45, delay: 0.15, ease: 'easeOut' }}
                  />
                </svg>
              </motion.div>
            </div>

            {/* Badge: Verified and secure */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold tracking-wide"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified and secure</span>
            </motion.div>

            {/* Optional Manual Continue Button */}
            {onSuccessComplete && (
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                type="button"
                onClick={onSuccessComplete}
                className="w-full max-w-xs mt-0.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 border border-emerald-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="relative flex items-center justify-center py-1 overflow-visible">
            {/* The 6 animated folding boxes */}
            <div className="flex items-center justify-center gap-2 sm:gap-2.5">
              {digits.map((digit, idx) => {
                const isFocused = focusedIndex === idx;
                const isFilled = Boolean(digit);
                const animProps = getBoxAnimation(idx);

                return (
                  <motion.div
                    key={idx}
                    animate={animProps}
                    className="relative"
                  >
                    <input
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={length}
                      value={digit}
                      disabled={disabled || animPhase !== 'idle'}
                      onChange={(e) => handleInputChange(idx, e)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      onFocus={() => setFocusedIndex(idx)}
                      onBlur={() => setFocusedIndex(null)}
                      className={`w-11 h-12.5 sm:w-11.5 sm:h-13 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl transition-all outline-hidden cursor-text select-none ${
                        isFocused
                          ? accentColor === 'amber'
                            ? 'bg-amber-950/30 border-2 border-amber-400 text-amber-200 ring-4 ring-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                            : 'bg-indigo-950/30 border-2 border-indigo-400 text-white ring-4 ring-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                          : isFilled
                          ? 'bg-zinc-900/90 border border-zinc-700 text-white shadow-xs'
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
