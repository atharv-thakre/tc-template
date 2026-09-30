import React, { useState, useRef, useEffect } from 'react';
import { Check, ShieldCheck } from 'lucide-react';

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
  onSuccessComplete,
  onComplete,
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length }, (_, i) => value[i] || '');

  // Keep input refs sized to length
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Handle autoFocus
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Trigger onSuccessComplete if provided
  useEffect(() => {
    if (isSuccess && onSuccessComplete) {
      const timer = setTimeout(() => {
        onSuccessComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onSuccessComplete]);

  // Handle keyboard inputs per box
  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const rawVal = e.target.value;

    // Handle paste or multi-character input
    if (rawVal.length > 1) {
      const cleanDigits = rawVal.replace(/\D/g, '');
      if (cleanDigits.length >= 2) {
        const sliced = cleanDigits.slice(0, length);
        onChange(sliced);
        const nextIdx = Math.min(sliced.length, length - 1);
        inputRefs.current[nextIdx]?.focus();
        if (sliced.length === length && onComplete) {
          onComplete(sliced);
        }
        return;
      }

      // If user typed a new character over an existing box, take the latest character
      const lastChar = rawVal.slice(-1).replace(/\D/g, '');
      const currentChars = Array.from({ length }, (_, i) => value[i] || '');
      currentChars[index] = lastChar;
      const newCombined = currentChars.join('').trimEnd();
      onChange(newCombined);
      if (lastChar && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      if (newCombined.length === length && onComplete) {
        onComplete(newCombined);
      }
      return;
    }

    const digit = rawVal.replace(/\D/g, '');
    const currentChars = Array.from({ length }, (_, i) => value[i] || '');
    currentChars[index] = digit;
    const newCombined = currentChars.join('').trimEnd();

    onChange(newCombined);

    // If user typed a digit, advance focus to next box
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger onComplete when all digits are filled
    if (newCombined.length === length && onComplete) {
      onComplete(newCombined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

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
    if (disabled) return;
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

  return (
    <div className="w-full py-0.5">
      {/* Rock-solid, stationary 6-digit input blocks - Proportional & consistent */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {digits.map((digit, idx) => {
          const isFocused = focusedIndex === idx;
          const isFilled = Boolean(digit);

          return (
            <div key={idx} className="relative">
              <input
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={length}
                value={digit}
                disabled={disabled}
                onChange={(e) => handleInputChange(idx, e)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                onFocus={() => setFocusedIndex(idx)}
                onBlur={() => setFocusedIndex(null)}
                className={`w-8.5 h-9.5 sm:w-9 sm:h-10 text-center font-mono text-sm sm:text-base font-semibold rounded-lg transition-all outline-none cursor-text select-none ${
                  isSuccess
                    ? 'bg-emerald-950/40 border border-emerald-500/80 text-emerald-300 ring-2 ring-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : isFocused
                    ? accentColor === 'amber'
                      ? 'bg-amber-950/30 border border-amber-400 text-amber-200 ring-2 ring-amber-500/25'
                      : 'bg-indigo-950/40 border border-indigo-500 text-white ring-2 ring-indigo-500/25'
                    : isFilled
                    ? 'bg-black/45 border border-white/25 text-white shadow-xs'
                    : 'bg-black/35 border border-white/10 text-zinc-400 hover:border-white/20'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
          );
        })}
      </div>

      {isSuccess && (
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{successTitle}</span>
        </div>
      )}
    </div>
  );
};
