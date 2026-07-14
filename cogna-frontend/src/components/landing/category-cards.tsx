'use client';

import React from 'react';
import Link from 'next/link';
import { MessageSquare, Image as ImageIcon, Video, Code, Shield, Zap, RefreshCw, Headphones, ArrowRight } from 'lucide-react';

interface CategoryItem {
  name: string;
  slug: string;
  desc: string;
  productCount: number;
  iconBg: string;
  icon: React.ReactNode;
  borderClass: string;
  topGradClass: string;
  exploreColor: string;
  tiles: {
    left: React.ReactNode;
    leftBg: string;
    leftRotate: string;
    center: React.ReactNode;
    centerBg: string;
    centerRotate: string;
    right: React.ReactNode;
    rightBg: string;
    rightRotate: string;
  };
}

export default function CategoryCards() {
  const categories: CategoryItem[] = [
    {
      name: 'AI Assistants',
      slug: 'natural-language',
      desc: 'Chat, write, research, and get things done with intelligent assistants.',
      productCount: 32,
      iconBg: 'bg-[#18B88A]/10 text-[#18B88A]',
      icon: <MessageSquare size={20} />,
      borderClass: 'border-[#18B88A]/15 hover:border-[#18B88A]/40 hover:shadow-[0_15px_35px_rgba(24,184,138,0.08)]',
      topGradClass: 'from-[#18B88A]/5 to-transparent',
      exploreColor: 'text-[#18B88A] hover:text-[#0F5B46]',
      tiles: {
        left: (
          // ChatGPT Icon
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.7,11.3c0.2-1.3-0.5-2.6-1.7-3.1c0.1-0.3,0.1-0.6,0.1-0.9c0-1.7-1.4-3.1-3.1-3.1-0.6,0-1.1,0.2-1.6,0.5-0.7-1.1-1.9-1.8-3.3-1.8-2.1,0-3.8,1.7-3.8,3.8,0,0.3,0,0.5,0.1,0.8C7.5,7,6.3,6.8,5.1,7.5C3.9,8.2,3.3,9.5,3.6,10.9c-0.9,0.5-1.5,1.5-1.5,2.6,0,1.7,1.4,3.1,3.1,3.1,0.3,0,0.5,0,0.8-0.1,0.5,0.9,1.5,1.5,2.6,1.5,0.6,0,1.1-0.2,1.6-0.5,0.7,1.1,1.9,1.8,3.3,1.8,2.1,0,3.8-1.7,3.8-3.8,0-0.3,0-0.5-0.1-0.8,0.9,0.5,2.1,0.7,3.3,0,1.2-0.7,1.8-2,1.5-3.4C21.1,12.3,21.7,11.3,21.7,11.3z" />
          </svg>
        ),
        leftBg: 'bg-[#10a37f]',
        leftRotate: '-rotate-[12deg] -translate-x-5 translate-y-3 z-0',
        center: (
          // Gemini Sparkle
          <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z" fill="url(#cat-gem-1)" />
            <defs>
              <linearGradient id="cat-gem-1" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#93c5fd" />
                <stop offset="0.5" stopColor="#a78bfa" />
                <stop offset="1" stopColor="#f472b6" />
              </linearGradient>
            </defs>
          </svg>
        ),
        centerBg: 'bg-white shadow-md border border-slate-100',
        centerRotate: 'rotate-[8deg] scale-110 z-10',
        right: (
          // Claude Text "AI"
          <span className="text-sm font-black text-white font-display">AI</span>
        ),
        rightBg: 'bg-[#d97706]',
        rightRotate: 'rotate-[15deg] translate-x-5 translate-y-4 z-0',
      },
    },
    {
      name: 'Image Generation',
      slug: 'computer-vision',
      desc: 'Create stunning images, art, and visuals from text or ideas.',
      productCount: 18,
      iconBg: 'bg-indigo-500/10 text-indigo-600',
      icon: <ImageIcon size={20} />,
      borderClass: 'border-indigo-500/15 hover:border-indigo-500/40 hover:shadow-[0_15px_35px_rgba(99,102,241,0.08)]',
      topGradClass: 'from-indigo-500/5 to-transparent',
      exploreColor: 'text-[#18B88A] hover:text-[#0F5B46]',
      tiles: {
        left: (
          // Midjourney Sailboat SVG
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#0f2c59]">
            <path d="M2 17h20c-3-2-5-6-8-6H8c-3 0-5 4-8 6Z" />
            <path d="M12 2v9M9 5l3-3 3 3" />
          </svg>
        ),
        leftBg: 'bg-white shadow-sm border border-slate-100',
        leftRotate: '-rotate-[15deg] -translate-x-5 translate-y-3 z-0',
        center: (
          // Adobe Firefly Sparkle Triangle
          <svg viewBox="0 0 24 24" className="w-10 h-10" fill="url(#cat-firefly)">
            <path d="M12 2L2 22h4.5l2.5-5.5h6l2.5 5.5H22L12 2zm1 11h-2l1-2.5 1 2.5z" />
            <defs>
              <linearGradient id="cat-firefly" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff4b2b" />
                <stop offset="50%" stopColor="#ff416c" />
                <stop offset="100%" stopColor="#8a2387" />
              </linearGradient>
            </defs>
          </svg>
        ),
        centerBg: 'bg-slate-900 border border-slate-800 shadow-md',
        centerRotate: 'rotate-[12deg] scale-110 z-10',
        right: (
          // DALL-E Spiral Sparkle
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-slate-800" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z" />
          </svg>
        ),
        rightBg: 'bg-white shadow-sm border border-slate-100',
        rightRotate: 'rotate-[5deg] translate-x-5 translate-y-4 z-0',
      },
    },
    {
      name: 'Video Creation',
      slug: 'voice-audio', // Reseller fallback
      desc: 'Edit, generate, and enhance videos with powerful AI tools.',
      productCount: 14,
      iconBg: 'bg-amber-500/10 text-amber-600',
      icon: <Video size={20} />,
      borderClass: 'border-amber-500/15 hover:border-amber-500/40 hover:shadow-[0_15px_35px_rgba(245,158,11,0.08)]',
      topGradClass: 'from-amber-500/5 to-transparent',
      exploreColor: 'text-[#18B88A] hover:text-[#0F5B46]',
      tiles: {
        left: (
          // CapCut
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-slate-800" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 6H9v6h6V9z" />
          </svg>
        ),
        leftBg: 'bg-white shadow-sm border border-slate-100',
        leftRotate: '-rotate-[8deg] -translate-x-5 translate-y-3 z-0',
        center: (
          // Runway
          <span className="text-[9px] font-black text-white tracking-widest font-mono">RUNWAY</span>
        ),
        centerBg: 'bg-slate-950 border border-slate-850 shadow-md',
        centerRotate: 'rotate-[12deg] scale-110 z-10',
        right: (
          // Play button/Sora
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="url(#cat-sora-grad)" />
            <defs>
              <linearGradient id="cat-sora-grad" x1="2" y1="2" x2="22" y2="22">
                <stop stopColor="#3b82f6" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        ),
        rightBg: 'bg-white shadow-sm border border-slate-100',
        rightRotate: 'rotate-[18deg] translate-x-5 translate-y-4 z-0',
      },
    },
    {
      name: 'Developer APIs',
      slug: 'natural-language', // Fallback
      desc: 'Integrate leading AI models and capabilities into your applications.',
      productCount: 25,
      iconBg: 'bg-teal-500/10 text-teal-600',
      icon: <Code size={20} />,
      borderClass: 'border-teal-500/15 hover:border-teal-500/40 hover:shadow-[0_15px_35px_rgba(20,184,166,0.08)]',
      topGradClass: 'from-teal-500/5 to-transparent',
      exploreColor: 'text-[#18B88A] hover:text-[#0F5B46]',
      tiles: {
        left: (
          // OpenAI Spiral
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-slate-800" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z" />
          </svg>
        ),
        leftBg: 'bg-white shadow-sm border border-slate-100',
        leftRotate: '-rotate-[10deg] -translate-x-5 translate-y-3 z-0',
        center: (
          // Gemini Sparkle
          <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z" fill="url(#cat-gem-2)" />
            <defs>
              <linearGradient id="cat-gem-2" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#93c5fd" />
                <stop offset="0.5" stopColor="#a78bfa" />
                <stop offset="1" stopColor="#f472b6" />
              </linearGradient>
            </defs>
          </svg>
        ),
        centerBg: 'bg-white shadow-md border border-slate-100',
        centerRotate: 'rotate-[6deg] scale-110 z-10',
        right: (
          // Claude Text "AI"
          <span className="text-sm font-black text-white font-display">AI</span>
        ),
        rightBg: 'bg-[#d97706]',
        rightRotate: 'rotate-[12deg] translate-x-5 translate-y-4 z-0',
      },
    },
  ];

  const trustItems = [
    {
      title: '100% Secure',
      desc: 'Your payments and data are always protected.',
      icon: <Shield size={20} className="text-[#18B88A]" />,
    },
    {
      title: 'Instant Delivery',
      desc: 'Get access to your tools immediately after purchase.',
      icon: <Zap size={20} className="text-[#18B88A]" />,
    },
    {
      title: 'Cancel Anytime',
      desc: 'No lock-ins. Change or cancel anytime.',
      icon: <RefreshCw size={20} className="text-[#18B88A]" />,
    },
    {
      title: '24/7 Support',
      desc: 'Real human support whenever you need it.',
      icon: <Headphones size={20} className="text-[#18B88A]" />,
    },
  ];

  return (
    <section className="bg-white py-24 font-display relative z-10">
      
      {/* Background soft ambient blurs */}
      <div className="absolute top-[5%] left-[5%] w-[400px] h-[400px] bg-[#18B88A]/5 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[5%] right-[5%] w-[450px] h-[450px] bg-[#D4AF37]/5 rounded-full blur-[140px] pointer-events-none z-0" />

      <div className="mx-auto max-w-7xl px-8 sm:px-12 lg:px-16 relative z-10">
        
        {/* HEADER SECTION */}
        <div className="text-center flex flex-col items-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#18B88A]/10 text-[#18B88A] text-[10px] font-bold tracking-widest uppercase mb-4 shadow-sm">
            Browse
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight mb-4">
            Browse by <span className="text-[#0F5B46]">Category</span>
          </h2>
          
          <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-[650px] text-center">
            Find the perfect AI tools and subscriptions organized by what you want to build.
          </p>
        </div>

        {/* 4 CARD GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch mb-20">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 group ${cat.borderClass}`}
            >
              
              {/* Top part with floating 3D squircle tiles illustration */}
              <div>
                <div className={`relative w-full h-36 rounded-2xl bg-gradient-to-b ${cat.topGradClass} flex items-center justify-center overflow-visible mb-6 transition-all duration-300 group-hover:scale-[1.03]`}>
                  
                  {/* Left Tile */}
                  <div className={`absolute w-[60px] h-[60px] rounded-[18px] flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:-translate-x-6 group-hover:-translate-y-1 ${cat.tiles.leftBg} ${cat.tiles.leftRotate}`}>
                    {cat.tiles.left}
                  </div>

                  {/* Center Tile (Primary) */}
                  <div className={`absolute w-[72px] h-[72px] rounded-[20px] flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-105 ${cat.tiles.centerBg} ${cat.tiles.centerRotate}`}>
                    {cat.tiles.center}
                  </div>

                  {/* Right Tile */}
                  <div className={`absolute w-[60px] h-[60px] rounded-[18px] flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:translate-x-6 group-hover:-translate-y-1 ${cat.tiles.rightBg} ${cat.tiles.rightRotate}`}>
                    {cat.tiles.right}
                  </div>

                </div>

                {/* Category Icon Badge */}
                <div className={`p-3 w-fit rounded-2xl ${cat.iconBg} mb-5 flex items-center justify-center shadow-sm`}>
                  {cat.icon}
                </div>

                {/* Category Details */}
                <h3 className="text-xl font-bold text-slate-800 mb-2.5">
                  {cat.name}
                </h3>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-5 min-h-[36px]">
                  {cat.desc}
                </p>
              </div>

              {/* Bottom part stats and link */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
                <div className="text-xs font-semibold text-slate-500">
                  <span className="font-extrabold text-[#18B88A] text-sm mr-1">{cat.productCount}</span> Products
                </div>
                <Link
                  href={`/catalog?category=${cat.slug}`}
                  className={`text-xs font-bold flex items-center gap-1 transition-all duration-200 ${cat.exploreColor}`}
                >
                  Explore Category <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

            </div>
          ))}
        </div>

        {/* BOTTOM WHITE TRUST BAR */}
        <div className="rounded-2xl bg-slate-50/50 border border-slate-200/60 p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-6 lg:gap-y-0 lg:gap-8 items-center shadow-sm">
          {trustItems.map((item, idx) => (
            <div key={idx} className="flex items-start gap-4 px-4 lg:border-r lg:border-slate-200/60 last:border-0">
              <div className="p-2.5 rounded-xl bg-[#18B88A]/5 border border-[#18B88A]/10 text-[#18B88A] shrink-0 shadow-sm">
                {item.icon}
              </div>
              <div className="flex flex-col text-left">
                <h4 className="text-xs font-bold text-slate-800 tracking-wide">
                  {item.title}
                </h4>
                <p className="text-[10px] font-semibold text-slate-400 mt-1 leading-relaxed max-w-[170px]">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
