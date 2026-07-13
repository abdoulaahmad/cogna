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
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm border border-indigo-700/10 focus-visible:ring-indigo-500',
    secondary: 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-400',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm border border-rose-700/10 focus-visible:ring-rose-500',
    ghost: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-300',
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
