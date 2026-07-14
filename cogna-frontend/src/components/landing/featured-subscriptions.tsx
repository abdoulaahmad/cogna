'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, Check, Shield, Zap, RefreshCw, Headphones, Gift, ArrowRight } from 'lucide-react';

interface AIProduct {
  id: string;
  name: string;
  desc: string;
  logoBg: string;
  logoSvg: React.ReactNode;
  features: string[];
  price: string;
  currency: string;
  period: string;
  isPopular?: boolean;
}

export default function FeaturedSubscriptions() {
  const [activeTab, setActiveTab] = useState<'popular' | 'all'>('popular');

  const products: AIProduct[] = [
    {
      id: 'sub-gpt',
      name: 'ChatGPT Plus',
      desc: 'Access GPT-4o, DALL·E 3, and advanced tools.',
      logoBg: 'bg-[#10a37f]/15 border border-[#10a37f]/25',
      logoSvg: (
        <svg viewBox="0 0 24 24" className="h-8 w-8 fill-[#10a37f]" xmlns="http://www.w3.org/2000/svg">
          <path d="M21.7,11.3c0.2-1.3-0.5-2.6-1.7-3.1c0.1-0.3,0.1-0.6,0.1-0.9c0-1.7-1.4-3.1-3.1-3.1-0.6,0-1.1,0.2-1.6,0.5-0.7-1.1-1.9-1.8-3.3-1.8-2.1,0-3.8,1.7-3.8,3.8,0,0.3,0,0.5,0.1,0.8C7.5,7,6.3,6.8,5.1,7.5C3.9,8.2,3.3,9.5,3.6,10.9c-0.9,0.5-1.5,1.5-1.5,2.6,0,1.7,1.4,3.1,3.1,3.1,0.3,0,0.5,0,0.8-0.1,0.5,0.9,1.5,1.5,2.6,1.5,0.6,0,1.1-0.2,1.6-0.5,0.7,1.1,1.9,1.8,3.3,1.8,2.1,0,3.8-1.7,3.8-3.8,0-0.3,0-0.5-0.1-0.8,0.9,0.5,2.1,0.7,3.3,0,1.2-0.7,1.8-2,1.5-3.4C21.1,12.3,21.7,11.3,21.7,11.3z" />
        </svg>
      ),
      features: ['GPT-4o Access', 'DALL·E 3 Images', 'Priority Response'],
      price: '20.00',
      currency: '$',
      period: '/month',
      isPopular: true,
    },
    {
      id: 'sub-gemini',
      name: 'Google Gemini',
      desc: 'Advanced AI from Google with 1.5 Pro and latest features.',
      logoBg: 'bg-[#1e2238]/60 border border-indigo-500/25',
      logoSvg: (
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z" fill="url(#gemini-sub-gradient)" />
          <defs>
            <linearGradient id="gemini-sub-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#93c5fd" />
              <stop offset="0.5" stopColor="#a78bfa" />
              <stop offset="1" stopColor="#f472b6" />
            </linearGradient>
          </defs>
        </svg>
      ),
      features: ['Gemini 1.5 Pro', '1M Context Window', 'Google Integrations'],
      price: '19.99',
      currency: '$',
      period: '/month',
      isPopular: true,
    },
    {
      id: 'sub-claude',
      name: 'Claude Pro',
      desc: "Anthropic's Claude 3 Opus for complex tasks.",
      logoBg: 'bg-[#d97706]/10 border border-[#d97706]/25',
      logoSvg: (
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-[#d97706]" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 22h20L12 2zm0 4.2L19.3 19H4.7L12 6.2z" />
        </svg>
      ),
      features: ['Claude 3 Opus', '200K Context Window', 'Safety & Reliability'],
      price: '20.00',
      currency: '$',
      period: '/month',
      isPopular: true,
    },
    {
      id: 'sub-capcut',
      name: 'CapCut Pro',
      desc: 'AI-powered video editing made for creators.',
      logoBg: 'bg-gradient-to-tr from-pink-500/10 to-purple-600/10 border border-pink-500/25',
      logoSvg: (
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
        </svg>
      ),
      features: ['Pro Templates', 'AI Effects & Tools', 'Cloud Storage'],
      price: '9.99',
      currency: '$',
      period: '/month',
      isPopular: false,
    },
  ];

  const trustItems = [
    {
      title: '100% Secure',
      desc: 'Encrypted payments and data protection.',
      icon: <Shield size={20} className="text-[#18B88A]" />,
    },
    {
      title: 'Instant Access',
      desc: 'Get access in seconds after subscription.',
      icon: <Zap size={20} className="text-[#18B88A]" />,
    },
    {
      title: 'Cancel Anytime',
      desc: 'No lock-ins. Cancel or change plans anytime.',
      icon: <RefreshCw size={20} className="text-[#18B88A]" />,
    },
    {
      title: '24/7 Support',
      desc: "We're here to help you anytime, anywhere.",
      icon: <Headphones size={20} className="text-[#18B88A]" />,
    },
  ];

  return (
    <section className="bg-[#081A16] text-white py-20 relative overflow-hidden font-display">
      
      {/* Background Radial Glow Effects */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#18B88A]/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] left-[10%] w-[350px] h-[350px] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="mx-auto max-w-7xl px-8 sm:px-12 lg:px-16 relative z-10">
        
        {/* SECTION HEADER */}
        <div className="text-center flex flex-col items-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] text-[10px] font-bold tracking-widest uppercase mb-4 shadow-sm">
            Featured
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight mb-4">
            Featured AI <span className="text-[#D4AF37]">Subscriptions</span>
          </h2>
          
          <p className="text-sm font-medium text-[#C6D6D1] leading-relaxed max-w-[650px] text-center">
            Access the world's best AI models and tools through one unified subscription.
          </p>

          {/* FILTER TABS */}
          <div className="flex items-center bg-[#0C241E]/40 border border-white/5 p-1 rounded-full mt-10">
            <button
              onClick={() => setActiveTab('popular')}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 focus:outline-none ${
                activeTab === 'popular'
                  ? 'bg-[#18B88A] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Star size={12} className={activeTab === 'popular' ? 'fill-white text-white' : ''} />
              Popular
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 focus:outline-none ${
                activeTab === 'all'
                  ? 'bg-[#18B88A] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Services
            </button>
          </div>
        </div>

        {/* PRODUCT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch mb-16">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="relative rounded-[24px] bg-[rgba(18,46,39,0.8)] border border-white/5 hover:border-[#D4AF37]/45 p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(24,184,138,0.15)] group"
            >
              
              {/* Card top section */}
              <div>
                
                {/* Logo & Popular badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${prod.logoBg}`}>
                    {prod.logoSvg}
                  </div>
                  {prod.isPopular && (
                    <span className="border border-[#18B88A]/35 text-[#18B88A] bg-[#18B88A]/5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                      Popular
                    </span>
                  )}
                </div>

                {/* Details */}
                <h3 className="text-xl font-bold text-white mb-2 font-display">
                  {prod.name}
                </h3>
                <p className="text-xs text-[#C6D6D1] leading-relaxed mb-6 min-h-[40px]">
                  {prod.desc}
                </p>

                {/* Feature List */}
                <ul className="space-y-3 pt-4 border-t border-white/5 mb-8">
                  {prod.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs font-semibold text-[#C6D6D1]">
                      <Check size={14} className="text-[#18B88A] shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>

              </div>

              {/* Card bottom section */}
              <div>
                {/* Price */}
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-3xl font-bold text-white font-display">
                    {prod.currency}{prod.price}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {prod.period}
                  </span>
                </div>

                {/* CTA */}
                <button
                  onClick={() => alert(`Redirecting to subscribe page for ${prod.name}...`)}
                  className="w-full mt-6 py-3 rounded-full bg-[#D4AF37] hover:bg-[#B8860B] text-slate-950 font-bold text-xs transition-all duration-300 shadow-[0_4px_25px_rgba(212,175,55,0.18)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.35)] hover:-translate-y-[1px] flex items-center justify-center gap-1 group-hover:scale-[1.01]"
                >
                  Subscribe Now <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* BOTTOM TRUST BAR */}
        <div className="rounded-2xl bg-[#0C241E]/40 border border-white/5 p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-6 lg:gap-y-0 lg:gap-8 items-center mb-10">
          {trustItems.map((item, idx) => (
            <div key={idx} className="flex items-start gap-4 px-4 lg:border-r lg:border-white/5 last:border-0">
              <div className="p-2.5 rounded-xl bg-[#18B88A]/5 border border-[#18B88A]/10 text-[#18B88A] shrink-0">
                {item.icon}
              </div>
              <div className="flex flex-col text-left">
                <h4 className="text-xs font-bold text-white tracking-wide">
                  {item.title}
                </h4>
                <p className="text-[10px] font-semibold text-slate-400 mt-1 leading-relaxed max-w-[170px]">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Annual plan discount banner overlay */}
        <div className="rounded-2xl border border-white/5 bg-[#0C241E]/40 p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-[#D4AF37]/35 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/15 text-[#D4AF37] shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.08)]">
              <Gift size={24} />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-bold text-white font-display">
                Save more with annual plans
              </h4>
              <p className="text-xs text-slate-400 mt-1 font-semibold">
                Up to <span className="text-[#18B88A] font-bold">20% off</span> when you subscribe yearly.
              </p>
            </div>
          </div>
          <Link
            href="/catalog?billing=annual"
            className="rounded-full border border-white/10 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 px-6 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-all duration-300 flex items-center gap-1.5"
          >
            View Annual Plans <ArrowRight size={13} />
          </Link>
        </div>

      </div>
    </section>
  );
}
