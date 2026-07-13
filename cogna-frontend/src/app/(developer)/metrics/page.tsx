'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { GlassCard } from '@/components/ui/glass-card';
import { BarChart3, TrendingUp, CheckCircle, AlertTriangle, ArrowUpRight } from 'lucide-react';

export default function MetricsPage() {
  const stats = [
    {
      name: 'Total Requests',
      value: '248,390',
      change: '+14.2%',
      isPositive: true,
      icon: <BarChart3 size={18} className="text-indigo-600" />,
    },
    {
      name: 'Success Rate',
      value: '99.94%',
      change: '+0.02%',
      isPositive: true,
      icon: <CheckCircle size={18} className="text-emerald-600" />,
    },
    {
      name: 'Average Latency',
      value: '184ms',
      change: '-8.5%',
      isPositive: true, // latency dropping is positive
      icon: <TrendingUp size={18} className="text-purple-600" />,
    },
    {
      name: 'Failed Requests',
      value: '148',
      change: '+4.1%',
      isPositive: false,
      icon: <AlertTriangle size={18} className="text-rose-600" />,
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
    <DashboardLayout>
      <div className="space-y-8 font-display">
        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <GlassCard key={idx} className="p-5 border-slate-200/50 flex flex-col justify-between h-[120px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.name}</span>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">{stat.icon}</div>
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-xl font-bold text-slate-800">{stat.value}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  stat.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {stat.change}
                  <ArrowUpRight size={10} />
                </span>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Charts & Table Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Custom SVG Timeline Chart */}
          <GlassCard className="p-6 border-slate-200/50 lg:col-span-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Request volume (Last 24 Hours)</h3>
              <span className="text-[10px] font-bold text-slate-400">Total API traffic</span>
            </div>

            {/* Pure SVG Line Chart */}
            <div className="relative w-full h-64 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-center p-4">
              <svg viewBox="0 0 500 200" className="w-full h-full text-indigo-500 overflow-visible" fill="none">
                {/* Horizontal grid lines */}
                <line x1="0" y1="40" x2="500" y2="40" className="stroke-slate-100 stroke-[1]" />
                <line x1="0" y1="90" x2="500" y2="90" className="stroke-slate-100 stroke-[1]" />
                <line x1="0" y1="140" x2="500" y2="140" className="stroke-slate-100 stroke-[1]" />
                
                {/* Chart line path */}
                <path
                  d="M 0 140 Q 50 120 100 80 T 200 110 T 300 50 T 400 90 T 500 40"
                  className="stroke-indigo-600 stroke-[2.5]"
                />
                
                {/* Chart fill path (area chart effect) */}
                <path
                  d="M 0 140 Q 50 120 100 80 T 200 110 T 300 50 T 400 90 T 500 40 L 500 200 L 0 200 Z"
                  className="fill-indigo-600/5"
                />

                {/* X-axis labels */}
                <text x="5" y="195" className="fill-slate-400 font-bold text-[9px]">00:00</text>
                <text x="120" y="195" className="fill-slate-400 font-bold text-[9px]">06:00</text>
                <text x="240" y="195" className="fill-slate-400 font-bold text-[9px]">12:00</text>
                <text x="360" y="195" className="fill-slate-400 font-bold text-[9px]">18:00</text>
                <text x="470" y="195" className="fill-slate-400 font-bold text-[9px]">Now</text>
              </svg>
            </div>
          </GlassCard>

          {/* Response Codes Distribution */}
          <GlassCard className="p-6 border-slate-200/50 lg:col-span-4 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Response Codes</h3>
              <span className="text-[10px] font-bold text-slate-400">Distribution</span>
            </div>

            <div className="space-y-4 pt-2">
              {responseCodes.map((item, idx) => (
                <div key={idx} className="space-y-1.5 text-xxs font-semibold">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-bold">{item.code}</span>
                    <span className="font-bold text-slate-400">{item.count} ({item.percentage})</span>
                  </div>
                  
                  {/* Progress loader */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
                    <div
                      className={`h-full rounded-full ${
                        item.code.startsWith('2')
                          ? 'bg-indigo-600'
                          : item.code.startsWith('4')
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: item.percentage }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

        </div>
      </div>
    </DashboardLayout>
  );
}
