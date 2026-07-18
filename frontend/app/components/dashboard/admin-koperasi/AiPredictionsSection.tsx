"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

interface AiPredictionsSectionProps {
  predictions: Array<{
    fertilizer_name: string;
    suggested_kg: number;
    suggested_bags: number;
    status: string;
  }>;
}

export default function AiPredictionsSection({ predictions }: AiPredictionsSectionProps) {
  // 1. Filter data valid (PROCESSED & di atas 0 kg)
  // 2. Batasi menggunakan .slice(0, 2) untuk hanya mengambil 2 item teratas sesuai desain
  const topPredictions = predictions
    .filter((p) => p.status === "PROCESSED" && p.suggested_kg > 0)
    .slice(0, 2);

  return (
    <div className="w-full bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
      
      {/* SISI KIRI: Judul & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-amber-500 shrink-0 border border-blue-100">
          <Sparkles className="w-5 h-5 fill-amber-100" />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-800 tracking-tight leading-tight">
            Prediksi Kebutuhan Pupuk
          </h2>
          <p className="text-[11px] font-bold text-slate-400 mt-0.5">Bulan Depan</p>
        </div>
      </div>

      {/* SISI TENGAH: Container 2 Item Rekomendasi Teratas */}
      <div className="flex flex-wrap items-center gap-3 flex-1 justify-start sm:justify-center">
        {topPredictions.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium italic">
            Belum tersedia rekomendasi pengadaan.
          </p>
        ) : (
          topPredictions.map((pred, idx) => (
            <div 
              key={idx} 
              className="bg-white border border-slate-100/80 rounded-xl px-4 py-2 flex items-center gap-4 min-w-[120px] shadow-sm"
            >
              <span className="text-xs font-bold text-slate-500">
                {pred.fertilizer_name}
              </span>
              <span className="text-sm font-black text-emerald-800 whitespace-nowrap">
                {Math.round(pred.suggested_kg).toLocaleString("id-ID")} Kg
              </span>
            </div>
          ))
        )}
      </div>

      {/* SISI KANAN: Tombol Aksi Navigasi Tanpa Reload */}
      <div className="shrink-0">
        <Link 
          href="/dashboard/admin-koprasi/stok-inventaris" 
          className="inline-block bg-[#0f7643] hover:bg-[#0c6237] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all duration-200 tracking-wide text-center w-full sm:w-auto"
        >
          Lihat Detail Prediksi
        </Link>
      </div>

    </div>
  );
}