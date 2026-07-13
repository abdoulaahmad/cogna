import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-12 font-display">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              COGNA
            </span>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              Premium API subscriptions marketplace. Connecting you to powerful AI tools with instant provisioning and unified checkout.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Marketplace</h3>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li>
                <Link href="/catalog" className="hover:text-indigo-600 transition-colors">
                  Browse APIs
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=natural-language" className="hover:text-indigo-600 transition-colors">
                  Text & Chat
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=computer-vision" className="hover:text-indigo-600 transition-colors">
                  Image Generation
                </Link>
              </li>
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Developers</h3>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li>
                <Link href="/docs" className="hover:text-indigo-600 transition-colors">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/keys" className="hover:text-indigo-600 transition-colors">
                  Developer Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li>
                <Link href="/terms" className="hover:text-indigo-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xxs font-semibold text-slate-400">
            &copy; {currentYear} Cogna. All rights reserved.
          </p>
          <p className="text-xxs font-semibold text-slate-400">
            Designed for high performance.
          </p>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
