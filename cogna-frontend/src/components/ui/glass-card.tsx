import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  dark?: boolean;
}

export function GlassCard({ children, dark = false, className = '', ...props }: GlassCardProps) {
  return (
    <div
      className={`rounded-xl border backdrop-blur-md transition-all duration-300 ${
        dark
          ? 'border-slate-800/60 bg-slate-950/40 shadow-premium-dark'
          : 'border-slate-200/60 bg-white/70 shadow-premium'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
export default GlassCard;
