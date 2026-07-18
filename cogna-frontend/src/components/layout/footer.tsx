'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Shield } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#081A16] py-16 px-4 sm:px-8 font-display relative overflow-hidden">
      
      {/* Background Radial Glow */}
      <div className="absolute bottom-0 right-[20%] w-[350px] h-[350px] bg-[#18B88A]/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="mx-auto max-w-7xl relative z-10">
        
        {/* Floating Premium Card container */}
        <div className="rounded-[24px] bg-[#05110F]/90 border border-white/5 shadow-2xl p-8 md:p-12">
          
          <div className="grid grid-cols-1 md:grid-cols-[40fr_20fr_20fr_20fr] gap-10 md:gap-8 mb-12">
            
            {/* BRAND */}
            <div className="space-y-6 text-left">
              <Link href="/" className="block focus:outline-none">
                <img
                  src="/logo-cogna.png"
                  alt="Cogna Logo"
                  className="h-8 w-auto object-contain"
                />
              </Link>
              <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-[280px]">
                Premium AI subscriptions marketplace. Connecting you to powerful AI tools with instant provisioning at discounted rates.
              </p>
              
              {/* Social Circles */}
              <div className="flex items-center gap-3">
                {/* Custom X Logo */}
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full border border-[#18B88A]/20 bg-[#18B88A]/5 hover:bg-[#18B88A]/10 hover:border-[#18B88A]/60 text-[#18B88A] hover:text-[#D4AF37] flex items-center justify-center transition-all duration-300"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                
                {/* GitHub */}
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full border border-[#18B88A]/20 bg-[#18B88A]/5 hover:bg-[#18B88A]/10 hover:border-[#18B88A]/60 text-[#18B88A] hover:text-[#D4AF37] flex items-center justify-center transition-all duration-300"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </a>

                {/* Contact Email */}
                <a
                  href="mailto:support@cogna.com"
                  className="w-9 h-9 rounded-full border border-[#18B88A]/20 bg-[#18B88A]/5 hover:bg-[#18B88A]/10 hover:border-[#18B88A]/60 text-[#18B88A] hover:text-[#D4AF37] flex items-center justify-center transition-all duration-300"
                >
                  <Mail size={16} />
                </a>
              </div>
            </div>

            {/* QUICK LINKS: MARKETPLACE */}
            <div className="text-left">
              <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">
                Marketplace
              </h3>
              <div className="w-8 h-[2px] bg-[#18B88A] mt-2.5 mb-6 shadow-[0_0_8px_rgba(24,184,138,0.8)]" />
              <ul className="space-y-3.5 text-xs font-semibold text-slate-400">
                <li>
                  <Link href="/catalog" className="hover:text-[#D4AF37] transition-colors duration-200">
                    Browse Catalog
                  </Link>
                </li>
                <li>
                  <Link href="/catalog?category=natural-language" className="hover:text-[#D4AF37] transition-colors duration-200">
                    Text & Chat
                  </Link>
                </li>
                <li>
                  <Link href="/catalog?category=computer-vision" className="hover:text-[#D4AF37] transition-colors duration-200">
                    Image Generation
                  </Link>
                </li>
              </ul>
            </div>

            {/* QUICK LINKS: DEVELOPERS */}
            <div className="text-left">
              <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">
                Developers
              </h3>
              <div className="w-8 h-[2px] bg-[#18B88A] mt-2.5 mb-6 shadow-[0_0_8px_rgba(24,184,138,0.8)]" />
              <ul className="space-y-3.5 text-xs font-semibold text-slate-400">
                <li>
                  <Link href="/docs" className="hover:text-[#D4AF37] transition-colors duration-200">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link href="/keys" className="hover:text-[#D4AF37] transition-colors duration-200">
                    Developer Portal
                  </Link>
                </li>
              </ul>
            </div>

            {/* QUICK LINKS: LEGAL */}
            <div className="text-left">
              <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">
                Legal
              </h3>
              <div className="w-8 h-[2px] bg-[#18B88A] mt-2.5 mb-6 shadow-[0_0_8px_rgba(24,184,138,0.8)]" />
              <ul className="space-y-3.5 text-xs font-semibold text-slate-400">
                <li>
                  <Link href="/terms" className="hover:text-[#D4AF37] transition-colors duration-200">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-[#D4AF37] transition-colors duration-200">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          {/* Centered Infinity Divider line */}
          <div className="relative my-10 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative z-10 bg-[#05110F] px-4 text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z" />
              </svg>
            </div>
          </div>

          {/* Under footer grid */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-400">
            <p className="order-2 sm:order-1">
              &copy; {currentYear} Cogna. All rights reserved.
            </p>
            <div className="order-1 sm:order-2 flex items-center gap-2 text-slate-300">
              <Shield size={16} className="text-[#D4AF37]" />
              <span>Built for developers. Designed for scale.</span>
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
}
