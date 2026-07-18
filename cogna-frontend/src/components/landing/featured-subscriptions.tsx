'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Check, Shield, Zap, RefreshCw, Headphones, Gift, ArrowRight, ImageIcon, MessageSquare, Mic, Code2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Product } from '@/components/product/product-card';

export default function FeaturedSubscriptions() {
  const [activeTab, setActiveTab] = useState<'popular' | 'all'>('popular');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get('/products', { params: { limit: 4 } });
        if (response.data.success && response.data.data) {
          setProducts(response.data.data);
        }
      } catch (err) {
        console.error("Failed to load featured products", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
      title: 'Unbeatable Prices',
      desc: 'Premium AI tools at a fraction of the original cost.',
      icon: <Star size={20} className="text-[#18B88A]" />,
    },
    {
      title: '24/7 Support',
      desc: "We're here to help you anytime, anywhere.",
      icon: <Headphones size={20} className="text-[#18B88A]" />,
    },
  ];

  function getCategoryIcon(slug: string) {
    const props = { className: "h-8 w-8 text-[#F8D56B]", strokeWidth: 1.5 };
    if (slug.includes('language') || slug.includes('text')) return <MessageSquare {...props} />;
    if (slug.includes('vision') || slug.includes('image')) return <ImageIcon {...props} />;
    if (slug.includes('voice') || slug.includes('audio')) return <Mic {...props} />;
    return <Code2 {...props} />;
  }

  const displayedProducts = products; // Only loading 4 for now, so we just show what we have.

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
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-[#F8D56B]" size={32} />
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="flex justify-center items-center py-20 text-emerald-100/60 text-sm">
            No featured products available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch mb-16">
            {displayedProducts.map((prod) => (
              <div
                key={prod.id}
                className="relative rounded-[24px] bg-[rgba(18,46,39,0.8)] border border-white/5 hover:border-[#D4AF37]/45 p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(24,184,138,0.15)] group"
              >
                
                {/* Card top section */}
                <div>
                  
                  {/* Logo & Popular badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center bg-[#D4AF37]/10 border border-[#D4AF37]/25 overflow-hidden`}>
                      {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="h-full w-full object-cover" />
                      ) : (
                        getCategoryIcon(prod.category.slug)
                      )}
                    </div>
                    {/* Just default to Popular for the first item for UI fidelity */}
                    {displayedProducts[0].id === prod.id && (
                      <span className="border border-[#18B88A]/35 text-[#18B88A] bg-[#18B88A]/5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                        Popular
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <h3 className="text-xl font-bold text-white mb-2 font-display">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-[#C6D6D1] leading-relaxed mb-6 line-clamp-2 min-h-[40px]">
                    {prod.description || 'Access powerful AI features and exclusive capabilities directly through Cogna.'}
                  </p>

                  {/* Feature List (Mocked using the category) */}
                  <ul className="space-y-3 pt-4 border-t border-white/5 mb-8">
                    <li className="flex items-center gap-2 text-xs font-semibold text-[#C6D6D1]">
                      <Check size={14} className="text-[#18B88A] shrink-0" />
                      API Access Included
                    </li>
                    <li className="flex items-center gap-2 text-xs font-semibold text-[#C6D6D1]">
                      <Check size={14} className="text-[#18B88A] shrink-0" />
                      Instant Provisioning
                    </li>
                    <li className="flex items-center gap-2 text-xs font-semibold text-[#C6D6D1]">
                      <Check size={14} className="text-[#18B88A] shrink-0" />
                      {prod.category.name} capabilities
                    </li>
                  </ul>

                </div>

                {/* Card bottom section */}
                <div>
                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-3xl font-bold text-white font-display">
                      {new Intl.NumberFormat('en-NG', { style: 'currency', currency: prod.currency || 'NGN', minimumFractionDigits: 0 }).format(Number(prod.price))}
                    </span>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/catalog`}
                    className="w-full mt-6 py-3 rounded-full bg-[#D4AF37] hover:bg-[#B8860B] text-slate-950 font-bold text-xs transition-all duration-300 shadow-[0_4px_25px_rgba(212,175,55,0.18)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.35)] hover:-translate-y-[1px] flex items-center justify-center gap-1 group-hover:scale-[1.01]"
                  >
                    Subscribe Now <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}

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

        {/* Discount deals banner overlay */}
        <div className="rounded-2xl border border-white/5 bg-[#0C241E]/40 p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-[#D4AF37]/35 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/15 text-[#D4AF37] shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.08)]">
              <Gift size={24} />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-bold text-white font-display">
                Discover More Deals
              </h4>
              <p className="text-xs text-slate-400 mt-1 font-semibold">
                Explore our full catalog to find <span className="text-[#18B88A] font-bold">exclusive discounts</span> on top AI models.
              </p>
            </div>
          </div>
          <Link
            href="/catalog"
            className="rounded-full border border-white/10 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 px-6 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-all duration-300 flex items-center gap-1.5"
          >
            Explore Catalog <ArrowRight size={13} />
          </Link>
        </div>

      </div>
    </section>
  );
}
