"use client";

import React from "react";
import GreetingBanner from "./GreetingBanner";
import MetricCardsSection from "./MetricCardsSection";
import AiPredictionsSection from "./AiPredictionsSection";
import WarehouseStockSection from "./WarehouseStockSection";
import ChartAndMapSection from "./ChartAndMapSection";

interface OverviewContentProps {
  data: {
    meta: { cooperative_name: string; date: string };
    metrics: {
      total_anggota: number;
      kenaikan_anggota: number;
      total_lahan: number;
      tanaman_aktif: number;
      transaksi_masuk_rp: number;
      stok_gudang_ton: number;
      permintaan_pupuk_karung: number;
    };
    ai_predictions: Array<{ fertilizer_name: string; suggested_kg: number; suggested_bags: number; status: string }>;
    tren_stok_pupuk: Array<{ bulan: string; stok_kg: number }>;
    tren_distribusi_perbulan: Array<{ bulan: string; distribusi_kg: number }>;
    stok_gudang_bulan_ini: Array<{ name: string; permintaan: number; color: string }>;
    peta_sebaran: any;
    stok_gudang: Array<{ id: number; fertilizer_code: string; name: string; current_stock_kg: number; status: string; persentase: number }>;
    aktivitas_terbaru: any[];
  };
}

export default function OverviewContent({ data }: OverviewContentProps) {
  if (!data) return null;

  return (
    <div className="w-full space-y-6 -mt-2.5">
      
      {/* BARIS 1: Greeting Banner */}
      <GreetingBanner formattedDate={data.meta.date} />

      {/* BARIS 2: Widget 6 Ringkasan Angka Utama */}
      <MetricCardsSection metrics={data.metrics} />

      {/* BARIS 3: Horizontal AI Predictions Banner */}
      <AiPredictionsSection predictions={data.ai_predictions} />

      {/* BARIS 4: Konten Utama Ekosistem */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* KOLOM KIRI (xl:col-span-2): Memuat Peta Sebaran Full & Grid 2 Chart/Bar di bawahnya */}
        <div className="xl:col-span-2 space-y-6 flex flex-col h-full">
          <ChartAndMapSection 
            peta={data.peta_sebaran} 
            trenStok={data.tren_stok_pupuk}
            trenDistribusi={data.tren_distribusi_perbulan}
            stokBulanIni={data.stok_gudang_bulan_ini}
          />
        </div>

        {/* KOLOM KANAN (xl:col-span-1): Monitoring Real-time & Riwayat Logistik */}
        <div className="xl:col-span-1">
          <WarehouseStockSection 
            stock={data.stok_gudang} 
            activities={data.aktivitas_terbaru} 
          />
        </div>

      </div>

    </div>
  );
}