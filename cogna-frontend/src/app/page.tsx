'use client';

import React from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/layout/public-layout';
import Hero from '@/components/landing/hero';
import CategoryCards from '@/components/landing/category-cards';
import ProductGrid from '@/components/product/product-grid';
import { Truck, RotateCcw, Shield } from 'lucide-react';
import type { Product } from '@/components/product/product-card';
import type { Category } from '@/components/product/category-selector';

// Mock catalog data for the landing page display
const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-nlp', name: 'Text & NLPs', slug: 'natural-language', description: 'Chat & translation APIs' },
  { id: 'cat-cv', name: 'Computer Vision', slug: 'computer-vision', description: 'Image generation & analysis' },
  { id: 'cat-voice', name: 'Voice & Audio', slug: 'voice-audio', description: 'TTS & speech tools' },
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'GPT-4o Chat API Integration',
    price: '5000',
    currency: 'NGN',
    description: 'Direct high-speed proxy endpoint accessing ChatGPT-4o models for chatbot agents.',
    slug: 'gpt-4o-chat-api',
    category: { id: 'cat-nlp', name: 'Text & NLPs', slug: 'natural-language' },
    paymentGateway: 'PAYSTACK',
  },
  {
    id: 'prod-2',
    name: 'Midjourney v6 Image Generator',
    price: '7500',
    currency: 'NGN',
    description: 'Generate high-fidelity visual assets using Midjourney API resellers endpoints.',
    slug: 'midjourney-v6-image-gen',
    category: { id: 'cat-cv', name: 'Computer Vision', slug: 'computer-vision' },
    paymentGateway: 'MONNIFY',
  },
  {
    id: 'prod-3',
    name: 'Claude 3.5 Sonnet API Proxy',
    price: '6000',
    currency: 'NGN',
    description: 'State-of-the-art text generation with massive context window parameters.',
    slug: 'claude-3-5-sonnet-proxy',
    category: { id: 'cat-nlp', name: 'Text & NLPs', slug: 'natural-language' },
    paymentGateway: 'PAYSTACK',
  },
  {
    id: 'prod-4',
    name: 'ElevenLabs Voice Synthesizer',
    price: '4000',
    currency: 'NGN',
    description: 'Realistic text-to-speech engine containing custom voice cloning parameters.',
    slug: 'elevenlabs-voice-synth',
    category: { id: 'cat-voice', name: 'Voice & Audio', slug: 'voice-audio' },
    paymentGateway: 'MONNIFY',
  },
  {
    id: 'prod-5',
    name: 'DALL-E 3 Image Generation',
    price: '3500',
    currency: 'NGN',
    description: 'Create premium artwork instantly using OpenAI DALL-E image generation.',
    slug: 'dall-e-3-image-gen',
    category: { id: 'cat-cv', name: 'Computer Vision', slug: 'computer-vision' },
    paymentGateway: 'PAYSTACK',
  },
  {
    id: 'prod-6',
    name: 'Whisper Transcription Engine',
    price: '2500',
    currency: 'NGN',
    description: 'Translate and transcribe voice audio files to text with multi-language parsing.',
    slug: 'whisper-transcription-engine',
    category: { id: 'cat-voice', name: 'Voice & Audio', slug: 'voice-audio' },
    paymentGateway: 'MONNIFY',
  },
];

export default function Home() {
  const handleAddToCart = (product: Product) => {
    // Cart actions will be integrated in Sprint 3
    alert(`Added ${product.name} to checkout cart!`);
  };

  return (
    <PublicLayout>
      {/* 30% Dark Hero Section (Header sits sticky inside PublicLayout) */}
      <Hero />

      {/* 70% White Content section containing catalog, categories, and values */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Featured Products Catalog list */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Featured AI Subscriptions</h2>
              <Link
                href="/catalog"
                className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition shadow-sm"
              >
                View All APIs
              </Link>
            </div>
            
            <ProductGrid
              products={MOCK_PRODUCTS}
              categories={MOCK_CATEGORIES}
              onAddToCart={handleAddToCart}
            />
          </div>

          {/* Categories Grid Section */}
          <CategoryCards />

          {/* Why Shop With Us Banner Card (Dark blue container) */}
          <div className="rounded-2xl bg-[#0c1024] p-8 sm:p-12 text-white font-display overflow-hidden relative border border-indigo-950/40 shadow-premium-dark">
            {/* Background design lines */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <h2 className="text-2xl font-bold text-center mb-10">Why Shop With Cogna?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Truck size={24} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wide">Instant Delivery</h3>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-[240px]">
                  All purchases are instantly fulfilled. Get your API credentials and keys within seconds.
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <RotateCcw size={24} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wide">Flexible Subscriptions</h3>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-[240px]">
                  Switch plans, upgrade, or cancel subscriptions directly from your customer dashboard.
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Shield size={24} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wide">Secure API Gateway</h3>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-[240px]">
                  Rest easy with robust JWT-secured routes, rate limiting, and encrypted provider proxy channels.
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </PublicLayout>
  );
}
