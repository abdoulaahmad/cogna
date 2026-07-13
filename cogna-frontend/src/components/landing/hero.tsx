'use client';

import React from 'react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="bg-[#080b14] text-white min-h-[50vh] flex items-center py-16 lg:py-24 font-display relative overflow-hidden">
      
      {/* LEFT & RIGHT columns container */}
      <div className="mx-auto max-w-7xl px-8 sm:px-12 lg:px-16 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[45fr_55fr] gap-12 items-center">
          
          {/* LEFT Column (45%) */}
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">
              Proxy API Gateways
            </span>
            
            {/* Huge 3-line headline with highlighted word */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-4 text-white">
              Subscribe to <br />
              Unified Developer <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                APIs
              </span>
            </h1>
            
            {/* Paragraph constrained to 60% of the column */}
            <p className="text-xs sm:text-sm font-semibold text-slate-400 leading-relaxed max-w-[85%] lg:max-w-[60%]">
              Unified payment checkouts, instant developer key credentials provisioning, and secure proxy integrations.
            </p>
            
            {/* Large spacing before buttons */}
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
          <div className="flex items-center justify-center relative min-h-[300px] lg:min-h-[400px]">
            
            {/* Neon glow behind the illustration */}
            <div className="absolute w-[250px] h-[250px] bg-indigo-600/15 rounded-full blur-[80px] pointer-events-none z-0" />
            
            {/* Floating Illustration */}
            <div className="relative animate-float z-10 w-72 h-72 lg:w-80 lg:h-80 flex items-center justify-center">
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full text-indigo-500 drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                fill="none"
              >
                {/* Orbital Rings */}
                <circle cx="100" cy="100" r="70" className="stroke-indigo-500/10 stroke-[1]" />
                <circle cx="100" cy="100" r="50" className="stroke-purple-500/15 stroke-[1] stroke-dashed" />
                
                {/* Central Sphere Core */}
                <circle cx="100" cy="100" r="24" className="fill-indigo-600/25 stroke-indigo-400/80 stroke-2" />
                <circle cx="100" cy="100" r="8" className="fill-purple-400 animate-pulse" />
                
                {/* Orbital nodes and lines */}
                <path d="M 60 100 A 40 20 25 1 0 140 100" className="stroke-indigo-400/30 stroke-[1.2]" />
                <path d="M 60 100 A 40 20 -25 1 0 140 100" className="stroke-purple-400/20 stroke-[1.2]" />
                
                <circle cx="100" cy="60" r="3" className="fill-indigo-300" />
                <circle cx="140" cy="100" r="3" className="fill-purple-300" />
                <circle cx="100" cy="140" r="3" className="fill-indigo-300" />
                <circle cx="60" cy="100" r="3" className="fill-purple-300" />
              </svg>
            </div>

            {/* Dark circular pedestal underneath the floating sphere */}
            <div className="absolute bottom-4 lg:bottom-8 left-1/2 -translate-x-1/2 w-48 h-4 bg-slate-950/60 rounded-full blur-[2px] border border-slate-800/10 z-0" />
          </div>

        </div>
      </div>
      
    </section>
  );
}
