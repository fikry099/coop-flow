'use client';

import React from 'react';
import { FaMap } from 'react-icons/fa';

interface ValidationFormProps {
  selectedFarmer: {
    nik: string;
    farmer_group?: {
      id: number;
      name: string;
      description?: string;
    };
    user?: {
      name: string;
    };
    name?: string;
  } | null | undefined; 
  selectedLand: {
    id: number;
    land_name: string;
    area: string | number;
    location_address?: string;
  } | null;
  areaHectares: string;
  setAreaHectares: (val: string) => void;
  plantingDate: string;
  setPlantingDate: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function ValidationForm({
  selectedFarmer,
  selectedLand,
  areaHectares,
  setAreaHectares,
  onSubmit,
  onCancel
}: ValidationFormProps) {
  
  const displayedName = selectedFarmer?.user?.name || selectedFarmer?.name || 'Petani belum dipilih';
  const displayedLandName = selectedLand?.land_name || 'Lahan belum dipilih';

  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
      <h2 className="text-base font-bold text-zinc-900 mb-4 flex items-center gap-2 border-b border-zinc-100 pb-3">
        <FaMap className="text-green-600" />
        <span>Lengkapi Data Validasi Spasial</span>
      </h2>
      
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Info Lahan Spesifik */}
        <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 mb-2">
          <label className="block text-[10px] font-bold text-zinc-400 tracking-wide uppercase mb-0.5">Target Plot Lahan</label>
          <p className="text-sm font-extrabold text-green-700">{displayedLandName}</p>
          {selectedLand?.location_address && (
            <p className="text-xs text-zinc-400 font-medium mt-0.5">{selectedLand.location_address}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 tracking-wide uppercase mb-1.5">Nama Terpilih</label>
            <input type="text" disabled value={displayedName} className="w-full bg-zinc-50 border border-zinc-200 text-zinc-500 rounded-xl p-2.5 text-sm font-medium focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 tracking-wide uppercase mb-1.5">NIK (Tervalidasi)</label>
            <input type="text" disabled value={selectedFarmer?.nik || ''} className="w-full bg-zinc-50 border border-zinc-200 text-zinc-500 rounded-xl p-2.5 text-sm font-medium focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 tracking-wide uppercase mb-1.5">Kelompok Tani</label>
            {/* PERBAIKAN 2: Ambil properti .name dari object farmer_group */}
            <input 
              type="text" 
              disabled 
              value={selectedFarmer?.farmer_group?.name || ''} 
              className="w-full bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-xl p-2.5 text-sm font-bold focus:outline-none" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 tracking-wide uppercase mb-1.5">Luas Lahan Riil (Hektar)</label>
            <input 
              type="number" 
              step="0.01" 
              value={areaHectares} 
              onChange={(e) => setAreaHectares(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500 transition" 
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 border border-zinc-200 text-zinc-600 font-bold rounded-xl hover:bg-zinc-50 transition text-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl shadow-sm transition text-sm"
          >
            Konfirmasi & Simpan ke Server
          </button>
        </div>
      </form>
    </div>
  );
}