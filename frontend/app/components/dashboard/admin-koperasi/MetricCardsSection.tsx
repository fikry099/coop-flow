"use client";

import React from "react";
import { Users, Mountain, Sprout, ArrowDownToLine, Box, ClipboardList, TrendingUp } from "lucide-react";

interface MetricCardsSectionProps {
  metrics: {
    total_anggota: number;
    kenaikan_anggota: number;
    total_lahan: number;
    tanaman_aktif: number;
    transaksi_masuk_rp: number;
    stok_gudang_ton: number;
    permintaan_pupuk_karung: number;
  };
}

export default function MetricCardsSection({ metrics }: MetricCardsSectionProps) {
  if (!metrics) return null;

  // Format rupiah untuk card keuangan
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    // Menggunakan gap-6 untuk jarak antar card yang pas
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      
      {/* CARD 1: Total Anggota */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Anggota</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{metrics.total_anggota}</span>
            <span className="text-sm font-bold text-slate-500">Orang</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-extrabold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +{((metrics.kenaikan_anggota / (metrics.total_anggota || 1)) * 100).toFixed(0)}%
            </span>
            <p className="text-[11px] text-slate-400 font-medium">
              +{metrics.kenaikan_anggota} baru bulan ini
            </p>
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-blue-50/70 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
          <Users className="w-7 h-7" />
        </div>
      </div>

      {/* CARD 2: Total Lahan */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Lahan</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{metrics.total_lahan}</span>
            <span className="text-sm font-bold text-slate-500">Hektar(Ha)</span>
          </div>
          <div className="mt-2">
            <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Terintegrasi Peta Digital
            </p>
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-fuchsia-50/70 flex items-center justify-center text-fuchsia-600 shrink-0 shadow-inner">
          <Mountain className="w-7 h-7" />
        </div>
      </div>

      {/* CARD 3: Tanaman Aktif */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tanaman Aktif</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{metrics.tanaman_aktif}</span>
            <span className="text-sm font-bold text-slate-500">Blok Lahan</span>
          </div>
          <div className="mt-2">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
              Fase Vegetatif/Generatif
            </span>
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-emerald-50/70 flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
          <Sprout className="w-7 h-7" />
        </div>
      </div>

      {/* CARD 4: Transaksi Masuk */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Transaksi Masuk</p>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-800 tracking-tight block truncate">
              {formatRupiah(metrics.transaksi_masuk_rp)}
            </span>
          </div>
          <div className="mt-3">
            <p className="text-[11px] text-slate-400 font-medium">
              Akumulasi penjualan hari ini
            </p>
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-indigo-50/70 flex items-center justify-center text-indigo-600 shrink-0 shadow-inner">
          <ArrowDownToLine className="w-7 h-7" />
        </div>
      </div>

      {/* CARD 5: Stok Gudang */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Stok Gudang</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{metrics.stok_gudang_ton}</span>
            <span className="text-sm font-bold text-slate-500">Ton</span>
          </div>
          <div className="mt-2">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 font-bold border border-orange-100">
              Kondisi Logistik Aman
            </span>
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-orange-50/70 flex items-center justify-center text-orange-600 shrink-0 shadow-inner">
          <Box className="w-7 h-7" />
        </div>
      </div>

      {/* CARD 6: Permintaan Pupuk */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Permintaan Pupuk</p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{metrics.permintaan_pupuk_karung}</span>
            <span className="text-sm font-bold text-slate-500">Karung</span>
          </div>
          <div className="mt-2">
            <p className="text-[11px] text-amber-700 font-bold">
              • Hari Ini
            </p>
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-amber-50/70 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
          <ClipboardList className="w-7 h-7" />
        </div>
      </div>

    </div>
  );
}