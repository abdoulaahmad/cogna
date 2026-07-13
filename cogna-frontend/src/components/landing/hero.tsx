import React from 'react';
import Link from 'next/link';
import { Zap, ShieldCheck, Activity, Terminal } from 'lucide-react';

export default function Hero() {
  return (
    <section className="bg-[#080b14] text-white pt-16 pb-20 font-display relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Elevate Your <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                AI Capabilities
              </span>
            </h1>
            
            <p className="text-sm sm:text-base font-semibold text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Unlock access to premium AI models, APIs, and subscriptions with instant key provisioning, unified checkout, and seamless billing.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/catalog"
                className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-6 py-3.5 text-sm font-bold shadow-md border border-indigo-700/10 transition-all duration-200"
              >
                Browse APIs
              </Link>
              <Link
                href="/docs"
                className="rounded-lg bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/30 px-6 py-3.5 text-sm font-bold text-slate-300 transition-all duration-200"
              >
                Explore Docs
              </Link>
            </div>
          </div>

          {/* Right Column: AI Neural Illustration (No placeholder images) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 flex items-center justify-center">
              {/* Radial Base ring */}
              <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-[spin_40s_linear_infinite]" />
              <div className="absolute inset-6 rounded-full border border-dashed border-purple-500/10 animate-[spin_25s_linear_infinite_reverse]" />
              
              {/* Glowing Pedestal/Ring Illustration */}
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full text-indigo-500/80 drop-shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                fill="none"
              >
                {/* Central glowing core */}
                <circle cx="100" cy="100" r="30" className="fill-indigo-600/20 stroke-indigo-400 stroke-2" />
                <circle cx="100" cy="100" r="10" className="fill-purple-400" />
                
                {/* Orbital lines */}
                <path d="M 50 100 A 50 25 30 1 0 150 100" className="stroke-indigo-400/40 stroke-[1.5]" />
                <path d="M 50 100 A 50 25 -30 1 0 150 100" className="stroke-purple-400/30 stroke-[1.5]" />
                
                {/* Connector dots */}
                <circle cx="100" cy="50" r="3" className="fill-indigo-300" />
                <circle cx="150" cy="100" r="3" className="fill-purple-300" />
                <circle cx="100" cy="150" r="3" className="fill-indigo-300" />
                <circle cx="50" cy="100" r="3" className="fill-purple-300" />
                
                <line x1="100" y1="50" x2="100" y2="70" className="stroke-indigo-400/50 stroke-dashed" />
                <line x1="150" y1="100" x2="130" y2="100" className="stroke-purple-400/50 stroke-dashed" />
                <line x1="100" y1="150" x2="100" y2="130" className="stroke-indigo-400/50 stroke-dashed" />
                <line x1="50" y1="100" x2="70" y2="100" className="stroke-purple-400/50 stroke-dashed" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom Horizontal Features Bar */}
        <div className="mt-20 pt-8 border-t border-slate-800/40">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-slate-400 font-display">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Zap size={18} />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-white uppercase">Instant Keys</h4>
                <p className="text-[10px] font-semibold text-slate-500">Auto-provisioned</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <ShieldCheck size={18} />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-white uppercase">Secure Payments</h4>
                <p className="text-[10px] font-semibold text-slate-500">Paystack & Monnify</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Activity size={18} />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-white uppercase">99.9% Uptime</h4>
                <p className="text-[10px] font-semibold text-slate-500">Proxy SLA Guaranteed</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Terminal size={18} />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-white uppercase">Dev-Centric</h4>
                <p className="text-[10px] font-semibold text-slate-500">Swagger Specs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default Hero;
