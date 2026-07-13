'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, Shield, Globe, Code2 } from 'lucide-react';

export default function Hero() {
  const features = [
    {
      title: 'Instant Delivery',
      desc: 'Provisioned automatically in minutes.',
      icon: <Zap className="text-white shrink-0" size={26} />,
    },
    {
      title: 'Secure Payments',
      desc: 'Protected checkouts via secure gateways.',
      icon: <Shield className="text-white shrink-0" size={26} />,
    },
    {
      title: 'Global Access',
      desc: 'Buy premium AI subscriptions worldwide.',
      icon: <Globe className="text-white shrink-0" size={26} />,
    },
    {
      title: 'Developer API',
      desc: 'Unified API integration specs.',
      icon: <Code2 className="text-white shrink-0" size={26} />,
    },
  ];

  return (
    <section className="bg-[#080b14] text-white flex flex-col font-display relative overflow-hidden pb-12">
      
      {/* Hero Content Section */}
      <div className="mx-auto max-w-7xl px-8 sm:px-12 lg:px-16 w-full relative z-10 pt-16 pb-12 lg:pt-20 lg:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-[45fr_55fr] gap-12 items-center">
          
          {/* LEFT Column (45%) */}
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">
              Proxy API Gateways
            </span>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-4 text-white">
              Subscribe to <br />
              Unified Developer <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                APIs
              </span>
            </h1>
            
            <p className="text-xs sm:text-sm font-semibold text-slate-400 leading-relaxed max-w-[85%] lg:max-w-[60%]">
              Unified payment checkouts, instant developer key credentials provisioning, and secure proxy integrations.
            </p>
            
            <div className="flex items-center gap-4 mt-8">
              <Link
                href="/catalog"
                className="rounded-full bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-xs font-bold shadow-md border border-indigo-700/10 transition-all duration-200"
              >
                Browse APIs
              </Link>
              <Link
                href="#about"
                className="rounded-full bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/30 px-6 py-3 text-xs font-bold text-slate-300 transition-all duration-200"
              >
                Explore Docs
              </Link>
            </div>
          </div>

          {/* RIGHT Column (55%) */}
          <div className="flex items-center justify-center relative min-h-[300px] lg:min-h-[350px]">
            
            {/* Neon glow behind the illustration */}
            <div className="absolute w-[250px] h-[250px] bg-indigo-600/15 rounded-full blur-[80px] pointer-events-none z-0" />
            
            {/* Floating Illustration */}
            <div className="relative animate-float z-10 w-72 h-72 lg:w-80 lg:h-80 flex items-center justify-center">
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full text-indigo-500 drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                fill="none"
              >
                <circle cx="100" cy="100" r="70" className="stroke-indigo-500/10 stroke-[1]" />
                <circle cx="100" cy="100" r="50" className="stroke-purple-500/15 stroke-[1] stroke-dashed" />
                <circle cx="100" cy="100" r="24" className="fill-indigo-600/25 stroke-indigo-400/80 stroke-2" />
                <circle cx="100" cy="100" r="8" className="fill-purple-400 animate-pulse" />
                <path d="M 60 100 A 40 20 25 1 0 140 100" className="stroke-indigo-400/30 stroke-[1.2]" />
                <path d="M 60 100 A 40 20 -25 1 0 140 100" className="stroke-purple-400/20 stroke-[1.2]" />
                <circle cx="100" cy="60" r="3" className="fill-indigo-300" />
                <circle cx="140" cy="100" r="3" className="fill-purple-300" />
                <circle cx="100" cy="140" r="3" className="fill-indigo-300" />
                <circle cx="60" cy="100" r="3" className="fill-purple-300" />
              </svg>
            </div>

            {/* Dark circular pedestal underneath the floating sphere */}
            <div className="absolute bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 w-48 h-4 bg-slate-950/60 rounded-full blur-[2px] border border-slate-800/10 z-0" />
          </div>

        </div>
      </div>

      {/* Feature Bar (Trust / Value Proposition Section) */}
      <div className="mx-auto max-w-7xl px-8 sm:px-12 lg:px-16 w-full relative z-10">
        <div className="bg-[#080b14] rounded-b-[20px] border-t border-slate-800/25 grid grid-cols-1 md:grid-cols-4 min-h-[70px] md:min-h-[80px] py-4 px-4 md:px-6 items-center gap-y-6 md:gap-y-0">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="relative flex items-center gap-4 px-4 lg:px-8"
            >
              {feat.icon}
              <div className="flex flex-col text-left">
                <h4 className="text-[11px] font-bold text-white tracking-wide uppercase leading-tight">
                  {feat.title}
                </h4>
                <p className="text-[10px] font-semibold text-slate-400 mt-1 leading-relaxed max-w-[160px]">
                  {feat.desc}
                </p>
              </div>
              
              {/* Taller vertical divider on the right side of the cell (70% of bar height) */}
              {idx < 3 && (
                <div className="hidden md:block absolute right-0 top-[15%] bottom-[15%] w-px bg-slate-800/25" />
              )}
            </div>
          ))}
        </div>
      </div>
      
    </section>
  );
}
