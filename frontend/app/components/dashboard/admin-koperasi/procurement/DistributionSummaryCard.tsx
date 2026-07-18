'use client';

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface DistributionSummaryCardProps {
  totalTon: string;
  totalBags: number;
  chartData: any[];
}

export default function DistributionSummaryCard({
  totalTon,
  totalBags,
  chartData
}: DistributionSummaryCardProps) {
  return (
    <div className="border border-zinc-100 rounded-lg bg-white shadow-sm p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-zinc-800">Ringkasan Distribusi</h3>
        <select className="text-[11px] font-semibold text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 outline-none">
          <option>Semua Periode</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-1">
        <div>
          <p className="text-[11px] text-zinc-400 font-medium">Total Berat Tersalurkan</p>
          <p className="text-lg font-bold text-zinc-900 mt-0.5">{totalTon} Ton</p>
          <p className="text-[10px] text-zinc-400 font-semibold flex items-center gap-0.5 mt-0.5">
            Data real-time logistik
          </p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-400 font-medium">Total Karung Tersalurkan</p>
          <p className="text-lg font-bold text-zinc-900 mt-0.5">{totalBags.toLocaleString('id-ID')} Karung</p>
          <p className="text-[10px] text-zinc-400 font-semibold flex items-center gap-0.5 mt-0.5">
            Akumulasi kuota disetujui
          </p>
        </div>
      </div>

      {/* Area Line Chart Mini */}
      <div className="h-28 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value) => [`${value} Ton`, 'Berat']} />
            <Area type="monotone" dataKey="ton" stroke="#059669" strokeWidth={2} fill="url(#colorTon)" />
            <defs>
              <linearGradient id="colorTon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}