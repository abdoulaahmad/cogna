import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-slate-600 font-display select-none"
          >
            {label}
          </label>
        ) : null}
        
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-all outline-none duration-150 ${
            error
              ? 'border-rose-500 bg-rose-50/10 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
              : 'border-slate-200 bg-white hover:border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
          } ${className}`}
          {...props}
        />
        
        {error ? (
          <span className="text-xs font-medium text-rose-500 select-none">
            {error}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
