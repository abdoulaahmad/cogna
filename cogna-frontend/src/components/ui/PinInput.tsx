'use client';

import { useRef, useState, ClipboardEvent, KeyboardEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PinInputProps {
  value: string;
  onChange: (pin: string) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
  id?: string;
}

/**
 * 6-cell OTP-style PIN input.
 * - Auto-advances focus on digit entry.
 * - Backspace moves to the previous cell.
 * - Paste of a 6-digit string fills all cells.
 * - Toggle to show/hide digits.
 */
export default function PinInput({ value, onChange, disabled = false, label, hint, id = 'pin' }: PinInputProps) {
  const cells = Array.from({ length: 6 });
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [show, setShow] = useState(false);

  function digits(): string[] {
    return value.padEnd(6, '').slice(0, 6).split('');
  }

  function update(index: number, char: string) {
    const arr = digits();
    arr[index] = char;
    onChange(arr.join('').replace(/\D/g, '').slice(0, 6));
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits()[index]) {
        update(index, '');
      } else if (index > 0) {
        update(index - 1, '');
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1);
    if (!digit) return;
    update(index, digit);
    if (index < 5) refs.current[index + 1]?.focus();
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const arr = digits();
    for (let i = 0; i < 6; i++) arr[i] = pasted[i] ?? '';
    onChange(arr.join(''));
    const nextFocus = Math.min(pasted.length, 5);
    refs.current[nextFocus]?.focus();
  }

  const digs = digits();

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-xs font-bold text-emerald-100/75" id={`${id}-label`}>
          {label}
        </p>
      )}
      <div className="flex items-center gap-2">
        <div
          role="group"
          aria-labelledby={label ? `${id}-label` : undefined}
          className="flex gap-2"
        >
          {cells.map((_, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              id={`${id}-cell-${i}`}
              type={show ? 'text' : 'password'}
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              value={digs[i] ?? ''}
              disabled={disabled}
              autoComplete="one-time-code"
              aria-label={`PIN digit ${i + 1}`}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              onFocus={(e) => e.target.select()}
              className={[
                'h-11 w-10 rounded-xl border text-center text-lg font-bold outline-none transition-colors',
                'border-emerald-100/20 bg-[#020E0C]/60',
                'focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25',
                digs[i] ? 'border-emerald-100/40 text-white' : 'text-emerald-100/30',
                disabled ? 'cursor-not-allowed opacity-50' : '',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Show / hide toggle */}
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          disabled={disabled}
          aria-label={show ? 'Hide PIN' : 'Show PIN'}
          className="ml-1 rounded-lg p-2 text-emerald-100/40 transition-colors hover:text-emerald-100 disabled:opacity-40"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {hint && (
        <p className="text-[11px] font-medium leading-5 text-emerald-100/45">{hint}</p>
      )}
    </div>
  );
}
