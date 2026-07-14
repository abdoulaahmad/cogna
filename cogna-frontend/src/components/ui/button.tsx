import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  // Styles based on variant
  const variantStyles = {
    primary: 'bg-[#D4AF37] hover:bg-[#B8860B] text-slate-950 shadow-md border border-[#F8D56B]/20 focus-visible:ring-[#D4AF37] font-bold rounded-full',
    secondary: 'bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/30 text-slate-300 hover:text-white focus-visible:ring-slate-500 rounded-full',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm border border-rose-700/10 focus-visible:ring-rose-500 rounded-full',
    ghost: 'text-[#C6D6D1] hover:bg-[#18B88A]/10 hover:text-white focus-visible:ring-emerald-500 rounded-full',
  };

  // Styles based on size
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2.5 text-sm rounded-lg',
    lg: 'px-5 py-3 text-base rounded-xl',
  };

  const isBtnDisabled = disabled || isLoading;

  return (
    <button
      disabled={isBtnDisabled}
      className={`inline-flex items-center justify-center font-display font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-white" />
      ) : null}
      {children}
    </button>
  );
}

export default Button;
