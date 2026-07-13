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
          <div className="flex items-center justify-center relative min-h-[350px] lg:min-h-[450px]">
            
            {/* Neon glow behind the illustration */}
            <div className="absolute w-[320px] h-[320px] bg-indigo-600/15 rounded-full blur-[90px] pointer-events-none z-0" />
            
            {/* SVG background rings mapping */}
            <div className="absolute w-[110%] h-[110%] flex items-center justify-center pointer-events-none z-0">
              <svg className="w-full h-full text-indigo-500/10" viewBox="0 0 200 200" fill="none">
                <circle cx="100" cy="100" r="85" className="stroke-indigo-500/10 stroke-[0.8]" />
                <circle cx="100" cy="100" r="65" className="stroke-purple-500/10 stroke-[0.8] stroke-dashed" />
              </svg>
            </div>

            {/* Floating particles */}
            <div className="absolute top-[20%] left-[25%] w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-40 blur-[0.5px] animate-pulse" />
            <div className="absolute bottom-[25%] right-[20%] w-2 h-2 bg-purple-400 rounded-full opacity-30 blur-[0.5px] animate-pulse" />
            <div className="absolute top-[60%] right-[15%] w-1 h-1 bg-pink-400 rounded-full opacity-50 blur-[0.5px] animate-pulse" />

            {/* Free-floating 3D Video Illustration (No card, borders, or background box panels) */}
            <div className="relative animate-float z-10 w-[140%] max-w-[580px] lg:w-[150%] lg:max-w-[650px] aspect-video flex items-center justify-center pointer-events-none">
              <video
                src="/Animate_the_hero_illustration.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={{ mixBlendMode: 'screen' }}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Dark circular pedestal underneath the floating container */}
            <div className="absolute bottom-2 lg:bottom-4 left-1/2 -translate-x-1/2 w-56 h-4 bg-slate-950/70 rounded-full blur-[2px] border border-slate-800/10 z-0" />
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
