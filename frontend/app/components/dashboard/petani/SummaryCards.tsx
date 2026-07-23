'use client';

import React from 'react';
import { FaMapMarkedAlt, FaBoxOpen, FaReceipt, FaSeedling } from 'react-icons/fa';

interface SummaryProps {
  totalLandHa: number;
  fertilizerReceivedKg: number;
  totalTransactions: number;
  mainCommodity: string;
}

export default function SummaryCards({
  totalLandHa,
  fertilizerReceivedKg,
  totalTransactions,
  mainCommodity,
}: SummaryProps) {
  // Hitung perkiraan sak (asumsi standar 1 sak = 50 kg)
  const totalBags = Math.floor(fertilizerReceivedKg / 50);

  return (
    <div className="space-y-3 font-sans">
      <h2 className="text-base font-extrabold text-slate-900">Ringkasan Saya</h2>

      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Lahan Saya */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl flex-shrink-0">
            <FaMapMarkedAlt className="text-xl" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-600 truncate">Lahan Saya</p>
            <p className="text-base font-black text-slate-900 leading-tight">
              {totalLandHa.toLocaleString('id-ID')} <span className="text-xs font-bold text-slate-600">Ha</span>
            </p>
          </div>
        </div>

        {/* Card 2: Pupuk Dibeli (Dengan Konversi Sak) */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl flex-shrink-0">
            <FaBoxOpen className="text-xl" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-600 truncate">Pupuk Dibeli</p>
            <p className="text-base font-black text-slate-900 leading-tight">
              {fertilizerReceivedKg.toLocaleString('id-ID')} <span className="text-xs font-bold text-slate-600">Kg</span>
            </p>
            {/* Informasi Pembantu dalam Sak/Karung */}
            {totalBags > 0 && (
              <p className="text-[10px] font-extrabold text-amber-700 truncate mt-0.5">
                (~{totalBags.toLocaleString('id-ID')} Karung)
              </p>
            )}
          </div>
        </div>

        {/* Card 3: Total Transaksi */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
            <FaReceipt className="text-xl" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-600 truncate">Total Transaksi</p>
            <p className="text-base font-black text-slate-900 leading-tight">
              {totalTransactions} <span className="text-xs font-bold text-slate-600">Kali</span>
            </p>
          </div>
        </div>

        {/* Card 4: Komoditas Utama */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl flex-shrink-0">
            <FaSeedling className="text-xl" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-600 truncate">Komoditas</p>
            <p className="text-base font-black text-slate-900 leading-tight truncate capitalize">
              {mainCommodity || '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}