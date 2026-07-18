'use client';

import React from 'react';
import { FaLeaf } from 'react-icons/fa';

export default function DistributionBanner() {
  return (
    // Warna background solid agar bersih dan cerah
    <div className="border border-[#e6f4ed] bg-[#f5f9f6] rounded-lg pl-6 pr-0 pt-5 pb-5 md:pb-0 flex items-center justify-between overflow-hidden relative shadow-sm min-h-[110px]">
      
      {/* Sisi Kiri: Teks tetap di atas */}
      <div className="flex items-center gap-5 z-10 max-w-[60%] pb-0 md:pb-2">
        <div className="w-14 h-14 rounded-full bg-[#dcf2e6] flex items-center justify-center text-[#15803d] shrink-0">
          <FaLeaf className="w-6 h-6 transform -rotate-12" />
        </div>
        
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-[#115e59] tracking-tight">
            Distribusi tepat waktu, petani sejahtera
          </h4>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">
            Terus pantau setiap proses distribusi untuk memastikan penyaluran pupuk berjalan lancar dan tepat sasaran.
          </p>
        </div>
      </div>
      
      {/* Sisi Kanan: Menggunakan Masking untuk transisi super halus */}
      <div className="absolute right-0 bottom-0 top-0 hidden md:flex items-end h-full w-full justify-end pointer-events-none z-0">
        <img 
          src="/benerdistribusi.png" 
          alt="Ilustrasi Distribusi" 
          className="h-[120%] w-auto object-contain object-right-bottom translate-y-[10px]"
          style={{
            // Teknik Masking: Membuat gambar pudar di sisi kiri
            maskImage: 'linear-gradient(to right, transparent 0%, black 30%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%)'
          }}
        />
      </div>
      
    </div>
  );
}