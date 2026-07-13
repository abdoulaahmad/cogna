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

          {/* RIGHT Column (55%) - Free-Floating native elements scene */}
          <div className="relative w-full h-[400px] lg:h-[500px] flex items-center justify-center">
            
            {/* Background glows & radial rings (Constellation scene background) */}
            <div className="absolute w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none z-0" />
            <div className="absolute w-[200px] h-[200px] bg-purple-600/5 rounded-full blur-[80px] pointer-events-none z-0" />
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <svg className="w-full h-full max-w-[550px] max-h-[550px] text-slate-800/40" viewBox="0 0 200 200" fill="none">
                {/* Orbital lines */}
                <circle cx="100" cy="100" r="75" className="stroke-indigo-500/5 stroke-[0.8]" />
                <circle cx="100" cy="100" r="50" className="stroke-purple-500/5 stroke-[0.8] stroke-dashed" />
                
                {/* Constellation linkages connecting core to the 4 quadrants */}
                <line x1="100" y1="100" x2="50" y2="50" className="stroke-indigo-500/10 stroke-[0.8] stroke-dasharray-[2_4]" />
                <line x1="100" y1="100" x2="150" y2="45" className="stroke-indigo-500/10 stroke-[0.8] stroke-dasharray-[2_4]" />
                <line x1="100" y1="100" x2="45" y2="150" className="stroke-purple-500/10 stroke-[0.8] stroke-dasharray-[2_4]" />
                <line x1="100" y1="100" x2="155" y2="155" className="stroke-purple-500/10 stroke-[0.8] stroke-dasharray-[2_4]" />
              </svg>
            </div>

            {/* Subtle floating particles (different levels of blurs and positions) */}
            <div className="absolute top-[12%] left-[15%] w-1.5 h-1.5 bg-indigo-400/50 rounded-full blur-[0.5px] animate-pulse" />
            <div className="absolute top-[28%] right-[22%] w-2 h-2 bg-purple-400/35 rounded-full blur-[0.5px] animate-pulse" />
            <div className="absolute bottom-[24%] left-[28%] w-1 h-1 bg-pink-400/60 rounded-full blur-[0.5px] animate-pulse" />
            <div className="absolute bottom-[35%] right-[12%] w-2.5 h-2.5 bg-indigo-400/25 rounded-full blur-[1px] animate-pulse" />

            {/* Dark circular pedestal underneath the constellation */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 h-4 bg-slate-950/70 rounded-full blur-[3px] border border-slate-800/10 z-0" />

            {/* NATIVE SCENE: 4 Independent Floating Logos & 1 Central Gateway Hub */}
            
            {/* 1. CENTRAL COGNA HUB NODE */}
            <div className="absolute z-20 animate-float flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 p-[1.5px] shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                <div className="h-full w-full rounded-2xl bg-[#080b14] flex items-center justify-center text-white">
                  <Code2 size={28} className="text-indigo-400" />
                </div>
              </div>
              <span className="text-[8px] font-bold tracking-widest text-indigo-400/80 uppercase mt-2.5 bg-indigo-950/40 border border-indigo-900/30 px-2 py-0.5 rounded-full">
                GATEWAY
              </span>
            </div>

            {/* 2. CHATGPT NODE (Top-Left) */}
            <div className="absolute top-[12%] left-[8%] md:left-[14%] z-10 animate-float-slow">
              <div className="h-14 w-14 rounded-full bg-[#10a37f] flex items-center justify-center text-white shadow-[0_10px_25px_rgba(16,163,127,0.3)] border border-[#10a37f]/20">
                <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.7,11.3c0.2-1.3-0.5-2.6-1.7-3.1c0.1-0.3,0.1-0.6,0.1-0.9c0-1.7-1.4-3.1-3.1-3.1c-0.6,0-1.1,0.2-1.6,0.5c-0.7-1.1-1.9-1.8-3.3-1.8c-2.1,0-3.8,1.7-3.8,3.8c0,0.3,0,0.5,0.1,0.8C7.5,7,6.3,6.8,5.1,7.5C3.9,8.2,3.3,9.5,3.6,10.9c-0.9,0.5-1.5,1.5-1.5,2.6c0,1.7,1.4,3.1,3.1,3.1c0.3,0,0.5,0,0.8-0.1c0.5,0.9,1.5,1.5,2.6,1.5c0.6,0,1.1-0.2,1.6-0.5c0.7,1.1,1.9,1.8,3.3,1.8c2.1,0,3.8-1.7,3.8-3.8c0-0.3,0-0.5-0.1-0.8c0.9,0.5,2.1,0.7,3.3,0c1.2-0.7,1.8-2,1.5-3.4C21.1,12.3,21.7,11.3,21.7,11.3z" />
                </svg>
              </div>
            </div>

            {/* 3. GEMINI NODE (Top-Right) */}
            <div className="absolute top-[14%] right-[8%] md:right-[14%] z-10 animate-float-fast">
              <div className="h-14 w-14 rounded-full bg-[#1e2238] flex items-center justify-center text-white shadow-[0_10px_25px_rgba(99,102,241,0.25)] border border-indigo-500/25">
                {/* Gemini Sparkle Logo */}
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z" fill="url(#gemini-gradient)" />
                  <defs>
                    <linearGradient id="gemini-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#93c5fd" />
                      <stop offset="0.5" stopColor="#a78bfa" />
                      <stop offset="1" stopColor="#f472b6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* 4. CLAUDE NODE (Bottom-Left) */}
            <div className="absolute bottom-[16%] left-[6%] md:left-[12%] z-10 animate-float-medium-1">
              <div className="h-14 w-14 rounded-full bg-[#d97706] flex items-center justify-center text-white shadow-[0_10px_25px_rgba(217,119,6,0.3)] border border-[#d97706]/20">
                <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 22h20L12 2zm0 4.2L19.3 19H4.7L12 6.2z" />
                </svg>
              </div>
            </div>

            {/* 5. CAPCUT NODE (Bottom-Right) */}
            <div className="absolute bottom-[16%] right-[6%] md:right-[12%] z-10 animate-float-medium-2">
              <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-[0_10px_25px_rgba(236,72,153,0.3)] border border-pink-500/20">
                <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                </svg>
              </div>
            </div>

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
