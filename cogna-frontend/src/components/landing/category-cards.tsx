import React from 'react';
import Link from 'next/link';
import { MessageSquare, ImageIcon, Mic } from 'lucide-react';

export default function CategoryCards() {
  const categories = [
    {
      name: 'Natural Language',
      slug: 'natural-language',
      description: 'Access state-of-the-art text generation, translation, and custom chat agents.',
      icon: <MessageSquare className="h-6 w-6 text-indigo-600" />,
      colorClass: 'from-indigo-500/10 to-indigo-500/0 text-indigo-600',
    },
    {
      name: 'Computer Vision',
      slug: 'computer-vision',
      description: 'Run high-fidelity image generation, styling, and visual analysis tools.',
      icon: <ImageIcon className="h-6 w-6 text-purple-600" />,
      colorClass: 'from-purple-500/10 to-purple-500/0 text-purple-600',
    },
    {
      name: 'Voice & Audio',
      slug: 'voice-audio',
      description: 'Integrate speech-to-text, synthesis, and audio transcription engines.',
      icon: <Mic className="h-6 w-6 text-pink-600" />,
      colorClass: 'from-pink-500/10 to-pink-500/0 text-pink-600',
    },
  ];

  return (
    <section className="bg-white py-16 font-display">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Shop By Category</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-6 transition-all duration-300 hover:shadow-premium hover:-translate-y-1 flex flex-col justify-between h-[220px] group"
            >
              {/* Background gradient wave */}
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full bg-gradient-to-bl ${cat.colorClass} opacity-60 pointer-events-none group-hover:scale-110 transition-transform duration-300`} />
              
              <div>
                {/* Icon wrapper */}
                <div className="p-3 w-fit rounded-lg bg-slate-50 border border-slate-100 mb-4 group-hover:bg-white group-hover:border-slate-200 transition-colors">
                  {cat.icon}
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-2">{cat.name}</h3>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-[200px]">
                  {cat.description}
                </p>
              </div>

              <Link
                href={`/catalog?category=${cat.slug}`}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
              >
                Shop Now <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
