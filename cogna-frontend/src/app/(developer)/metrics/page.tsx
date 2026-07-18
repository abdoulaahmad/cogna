'use client';

import React from 'react';
import CustomerPortalNav from '@/components/layout/customer-portal-nav';
import { BarChart3, TrendingUp, CheckCircle, AlertTriangle, ArrowUpRight } from 'lucide-react';

export default function MetricsPage() {
  const stats = [
    {
      name: 'Total Requests',
      value: '248,390',
      change: '+14.2%',
      isPositive: true,
      icon: <BarChart3 size={18} />,
      tone: 'gold'
    },
    {
      name: 'Success Rate',
      value: '99.94%',
      change: '+0.02%',
      isPositive: true,
      icon: <CheckCircle size={18} />,
      tone: 'green'
    },
    {
      name: 'Average Latency',
      value: '184ms',
      change: '-8.5%',
      isPositive: true, // latency dropping is positive
      icon: <TrendingUp size={18} />,
      tone: 'gold'
    },
    {
      name: 'Failed Requests',
      value: '148',
      change: '+4.1%',
      isPositive: false,
      icon: <AlertTriangle size={18} />,
      tone: 'rose'
    },
  ];

  const responseCodes = [
    { code: '200 OK', count: '235,102', percentage: '94.6%' },
    { code: '201 Created', count: '13,140', percentage: '5.3%' },
    { code: '400 Bad Request', count: '104', percentage: '0.04%' },
    { code: '429 Too Many Requests', count: '30', percentage: '0.01%' },
    { code: '500 Server Error', count: '14', percentage: '0.005%' },
  ];

  return (
    <main className="min-h-screen bg-[#020E0C] text-white lg:pl-64">
      <CustomerPortalNav current="/metrics" variant="sidebar" />
      <div className="min-h-screen px-5 pb-12 pt-[104px] sm:px-7 lg:px-8 xl:px-10">
        <div className="mx-auto max-w-[1440px]">
          
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#F8D56B]">Developer Tools</p>
          <h1 className="mt-3 font-display text-4xl font-bold">API Usage Metrics</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-emerald-100/65">
            Monitor your application's request volume, latency, and success rates.
          </p>

          <div className="mt-8 space-y-8 font-display">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <article key={idx} className="rounded-[2rem] border border-emerald-100/15 bg-[#061915] p-6 shadow-premium-dark flex flex-col justify-between h-[150px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-emerald-100/50 uppercase tracking-[.14em]">{stat.name}</span>
                    <span className={stat.tone === 'gold' ? 'flex h-10 w-10 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#F8D56B]' : stat.tone === 'green' ? 'flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-300'}>
                      {stat.icon}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-4">
                    <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${
                      stat.isPositive ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'
                    }`}>
                      {stat.change}
                      <ArrowUpRight size={12} />
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* Charts & Table Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Custom SVG Timeline Chart */}
              <section className="rounded-[2rem] border border-emerald-100/15 bg-[#061915] p-6 lg:p-8 shadow-premium-dark lg:col-span-8 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-emerald-100/10">
                  <h3 className="text-xs font-bold text-white uppercase tracking-[.14em]">Request volume (Last 24 Hours)</h3>
                  <span className="text-[10px] font-bold text-[#F8D56B]">Total API traffic</span>
                </div>

                {/* Pure SVG Line Chart */}
                <div className="relative w-full h-64 bg-black/20 rounded-2xl border border-emerald-100/10 flex items-center justify-center p-4">
                  <svg viewBox="0 0 500 200" className="w-full h-full text-[#D4AF37] overflow-visible" fill="none">
                    {/* Horizontal grid lines */}
                    <line x1="0" y1="40" x2="500" y2="40" className="stroke-emerald-100/10 stroke-[1]" />
                    <line x1="0" y1="90" x2="500" y2="90" className="stroke-emerald-100/10 stroke-[1]" />
                    <line x1="0" y1="140" x2="500" y2="140" className="stroke-emerald-100/10 stroke-[1]" />
                    
                    {/* Chart line path */}
                    <path
                      d="M 0 140 Q 50 120 100 80 T 200 110 T 300 50 T 400 90 T 500 40"
                      className="stroke-[#D4AF37] stroke-[3]"
                    />
                    
                    {/* Chart fill path (area chart effect) */}
                    <path
                      d="M 0 140 Q 50 120 100 80 T 200 110 T 300 50 T 400 90 T 500 40 L 500 200 L 0 200 Z"
                      className="fill-[#D4AF37]/10"
                    />

                    {/* X-axis labels */}
                    <text x="5" y="195" className="fill-emerald-100/50 font-bold text-[9px]">00:00</text>
                    <text x="120" y="195" className="fill-emerald-100/50 font-bold text-[9px]">06:00</text>
                    <text x="240" y="195" className="fill-emerald-100/50 font-bold text-[9px]">12:00</text>
                    <text x="360" y="195" className="fill-emerald-100/50 font-bold text-[9px]">18:00</text>
                    <text x="470" y="195" className="fill-emerald-100/50 font-bold text-[9px]">Now</text>
                  </svg>
                </div>
              </section>

              {/* Response Codes Distribution */}
              <section className="rounded-[2rem] border border-emerald-100/15 bg-[#061915] p-6 lg:p-8 shadow-premium-dark lg:col-span-4 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-emerald-100/10">
                  <h3 className="text-xs font-bold text-white uppercase tracking-[.14em]">Response Codes</h3>
                  <span className="text-[10px] font-bold text-emerald-100/50">Distribution</span>
                </div>

                <div className="space-y-6 pt-2">
                  {responseCodes.map((item, idx) => (
                    <div key={idx} className="space-y-2 text-xs font-semibold">
                      <div className="flex justify-between text-emerald-100">
                        <span className="font-bold">{item.code}</span>
                        <span className="font-bold text-emerald-100/60">{item.count} ({item.percentage})</span>
                      </div>
                      
                      {/* Progress loader */}
                      <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden border border-emerald-100/10">
                        <div
                          className={`h-full rounded-full ${
                            item.code.startsWith('2')
                              ? 'bg-emerald-400'
                              : item.code.startsWith('4')
                              ? 'bg-[#F8D56B]'
                              : 'bg-rose-400'
                          }`}
                          style={{ width: item.percentage }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
