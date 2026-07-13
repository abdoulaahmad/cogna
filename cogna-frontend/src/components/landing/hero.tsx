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
    <section 
      style={{
        background: 'radial-gradient(circle at 72% 48%, rgba(212,175,55,.18), transparent 35%), radial-gradient(circle at 80% 60%, rgba(244,197,66,.08), transparent 30%), linear-gradient(180deg,#1A140A 0%,#0F0F12 100%)'
      }}
      className="text-white flex flex-col font-display relative overflow-hidden pb-12"
    >
      
      {/* Hero Content Section */}
      <div className="mx-auto max-w-7xl px-8 sm:px-12 lg:px-16 w-full relative z-10 pt-16 pb-12 lg:pt-20 lg:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-[45fr_55fr] gap-12 items-center">
          
          {/* LEFT Column (45%) */}
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-2">
              Proxy API Gateways
            </span>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-4 text-white">
              Subscribe to <br />
              Unified Developer <br />
              <span className="bg-gradient-to-r from-[#F8D56B] via-[#D4AF37] to-[#B8860B] bg-clip-text text-transparent">
                APIs
              </span>
            </h1>
            
            <p className="text-xs sm:text-sm font-semibold text-slate-400 leading-relaxed max-w-[85%] lg:max-w-[60%]">
              Unified payment checkouts, instant developer key credentials provisioning, and secure proxy integrations.
            </p>
            
            <div className="flex items-center gap-4 mt-8">
              <Link
                href="/catalog"
                className="rounded-full bg-[#D4AF37] hover:bg-[#B8860B] px-6 py-3 text-xs font-bold text-slate-950 shadow-md border border-[#F8D56B]/20 transition-all duration-200"
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

          {/* RIGHT Column (55%) - Balanced circular centerpiece video */}
          <div className="relative w-full h-[450px] lg:h-[550px] flex items-center justify-center overflow-visible">
            
            {/* Background glows & radial rings (Illustration backdrop) */}
            <div className="absolute w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none z-0" />
            <div className="absolute w-[250px] h-[250px] bg-purple-600/5 rounded-full blur-[90px] pointer-events-none z-0" />
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <svg className="w-full h-full max-w-[600px] max-h-[600px] text-slate-800/40" viewBox="0 0 200 200" fill="none">
                <circle cx="100" cy="100" r="85" className="stroke-indigo-500/5 stroke-[0.8]" />
                <circle cx="100" cy="100" r="65" className="stroke-purple-500/5 stroke-[0.8] stroke-dashed" />
              </svg>
            </div>

            {/* Subtle floating particles */}
            <div className="absolute top-[12%] left-[15%] w-1.5 h-1.5 bg-indigo-400/50 rounded-full blur-[0.5px] animate-pulse" />
            <div className="absolute top-[28%] right-[22%] w-2 h-2 bg-purple-400/35 rounded-full blur-[0.5px] animate-pulse" />
            <div className="absolute bottom-[24%] left-[28%] w-1 h-1 bg-pink-400/60 rounded-full blur-[0.5px] animate-pulse" />
            <div className="absolute bottom-[35%] right-[12%] w-2.5 h-2.5 bg-indigo-400/25 rounded-full blur-[1px] animate-pulse" />

            {/* Dark circular pedestal underneath the floating centerpiece */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-4 bg-slate-950/70 rounded-full blur-[3px] border border-slate-800/10 z-0" />

            {/* Premium Circular Video Container: Reduced diameter by 22%, soft feathered radial mask, increased gold glow, internal video scaling */}
            <div 
              style={{
                WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 88%)',
                maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 88%)',
              }}
              className="relative animate-float z-10 w-[64%] sm:w-[70%] lg:w-[72%] max-w-[360px] aspect-square rounded-full overflow-hidden border border-[#D4AF37]/20 shadow-[0_0_60px_rgba(212,175,55,0.35)] flex items-center justify-center pointer-events-none"
            >
              <video
                src="/Animate_the_hero_illustration.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={{
                  mixBlendMode: 'screen',
                }}
                className="w-full h-full object-contain scale-[0.88]"
              />
            </div>

            {/* Soft top gradient overlay to fade top edge of the animation into the hero background */}
            <div className="absolute inset-x-0 top-0 h-[25%] bg-gradient-to-b from-[#1A140A] to-transparent pointer-events-none z-20" />

          </div>

        </div>
      </div>

      {/* Feature Bar (Trust / Value Proposition Section) */}
      <div className="mx-auto max-w-7xl px-8 sm:px-12 lg:px-16 w-full relative z-10">
        <div className="bg-[#0F0F12] rounded-b-[20px] border-t border-slate-800/25 grid grid-cols-1 md:grid-cols-4 min-h-[70px] md:min-h-[80px] py-4 px-4 md:px-6 items-center gap-y-6 md:gap-y-0">
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
