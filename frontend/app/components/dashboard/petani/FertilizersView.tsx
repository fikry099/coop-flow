'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaArrowLeft, 
  FaBoxOpen, 
  FaCheckCircle, 
  FaLayerGroup, 
  FaInfoCircle, 
  FaShoppingBag 
} from 'react-icons/fa';

interface Fertilizer {
  id: number;
  fertilizer_code: string;
  name: string;
  image: string | null;
  packaging_size_kg: number;
  current_stock_kg: number;
  price_per_kg: number;
  status: string;
}

interface FertilizersViewProps {
  fertilizers: Fertilizer[];
  loading?: boolean;
}

// 💀 Komponen Skeleton khusus untuk daftar pupuk
function FertilizerSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3.5 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex space-x-3.5 items-stretch h-[152px]"
        >
          {/* Skeleton Thumbnail */}
          <div className="w-24 rounded-xl bg-slate-200 flex-shrink-0 self-stretch" />

          {/* Skeleton Detail Teks */}
          <div className="flex-1 space-y-2 py-0.5">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-slate-200 rounded-md w-16" />
              <div className="h-4 bg-slate-200 rounded-full w-20" />
            </div>
            <div className="h-4 bg-slate-200 rounded-md w-3/4" />
            <div className="h-14 bg-slate-100 rounded-xl w-full" />
            <div className="h-3 bg-slate-200 rounded-md w-1/2 pt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FertilizersView({ fertilizers, loading }: FertilizersViewProps) {
  const router = useRouter();

  // Helper Format Rupiah
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Helper untuk membersihkan & memformat URL Gambar dari Backend
  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null;
    
    // Memperbaiki issue double '/storage//storage/' dari backend
    const cleanedPath = imagePath.replace('/storage//storage/', '/storage/');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    if (cleanedPath.startsWith('http')) return cleanedPath;
    return `${baseUrl}${cleanedPath.startsWith('/') ? '' : '/'}${cleanedPath}`;
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header Navigation Mobile */}
      <div className="flex items-center space-x-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs sticky top-2 z-10">
        <button
          onClick={() => router.push('/dashboard')}
          className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition cursor-pointer"
          aria-label="Kembali"
        >
          <FaArrowLeft className="text-sm" />
        </button>
        <div>
          <h1 className="text-base font-black text-slate-900">Pupuk di KDKMP</h1>
          <p className="text-xs text-slate-500 font-medium">Ketersediaan & harga pupuk koperasi</p>
        </div>
      </div>

      {/* Banner Informasi untuk Petani */}
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start space-x-3">
        <div className="p-2 bg-emerald-500 text-white rounded-xl flex-shrink-0 mt-0.5">
          <FaInfoCircle className="text-base" />
        </div>
        <div className="text-xs text-emerald-950 leading-relaxed">
          <p className="font-bold">Informasi Petani:</p>
          <p className="text-emerald-900 mt-0.5">
            Daftar harga dan stok pupuk di bawah ini adalah data resmi di Koperasi KDKMP Anda.
          </p>
        </div>
      </div>

      {/* KONDISI 1: SKELETON LOADING */}
      {loading ? (
        <FertilizerSkeleton />
      ) : fertilizers.length === 0 ? (
        /* KONDISI 2: DATA KOSONG */
        <div className="p-8 bg-white rounded-2xl text-center border border-slate-100 space-y-2">
          <FaBoxOpen className="mx-auto text-3xl text-slate-300" />
          <p className="text-xs font-semibold text-slate-600">Tidak ada pupuk yang tersedia saat ini.</p>
        </div>
      ) : (
        /* KONDISI 3: LIST PUPUK TERSEDIA */
        <div className="grid grid-cols-1 gap-3.5">
          {fertilizers.map((item) => {
            // Kalkulasi Harga Per Sak / Karung
            const pricePerBag = item.price_per_kg * item.packaging_size_kg;
            // Kalkulasi Sisa Karung
            const totalBags = Math.floor(item.current_stock_kg / item.packaging_size_kg);

            return (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex space-x-3.5 hover:border-amber-300 transition items-stretch"
              >
                {/* Thumbnail Gambar */}
                <div className="w-24 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center border border-slate-100 self-stretch relative">
                  {item.image ? (
                    <img
                      src={getImageUrl(item.image) || ''}
                      alt={item.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-1 text-center h-full">
                      <FaBoxOpen className="text-xl mb-1 text-slate-300" />
                      <span className="text-[9px] font-medium leading-none text-slate-400">Tanpa Foto</span>
                    </div>
                  )}
                </div>

                {/* Detail Informasi Utama */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Header Kode & Status */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-900 border border-amber-300/60 uppercase tracking-wide">
                      {item.fertilizer_code}
                    </span>
                    <span className="flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full capitalize">
                      <FaCheckCircle className="mr-1 text-[9px]" /> {item.status}
                    </span>
                  </div>

                  {/* Nama Pupuk */}
                  <h2 className="text-sm font-black text-slate-900 leading-snug truncate">
                    {item.name}
                  </h2>

                  {/* Rincian Harga Sak/Karung & Eceran Per Kg */}
                  <div className="bg-amber-50/70 border border-amber-200/50 rounded-xl p-2 mt-1">
                    <p className="text-[10px] text-amber-900 font-semibold flex items-center">
                      <FaShoppingBag className="mr-1 text-amber-700 text-[10px]" /> 
                      Harga per Sak ({item.packaging_size_kg} kg):
                    </p>
                    <p className="text-base font-black text-amber-800 leading-tight">
                      {formatRupiah(pricePerBag)}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                      Eceran: <strong className="text-slate-700">{formatRupiah(item.price_per_kg)}</strong> / kg
                    </p>
                  </div>

                  {/* Information Stok */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1.5 border-t border-slate-100">
                    <span className="flex items-center font-medium">
                      <FaLayerGroup className="mr-1 text-slate-400 text-[10px]" />
                      Sisa Stok:
                    </span>
                    <span className="font-extrabold text-slate-800">
                      {item.current_stock_kg.toLocaleString('id-ID')} kg 
                      <span className="text-emerald-700 font-bold ml-1">
                        (~{totalBags.toLocaleString('id-ID')} sak)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}