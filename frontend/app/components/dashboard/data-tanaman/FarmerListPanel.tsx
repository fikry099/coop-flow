'use client';

import React from 'react';
import { FaSearch, FaUserAlt } from 'react-icons/fa';
// Import tipe data langsung dari file page utama
import { Farmer } from '@/app/dashboard/admin-lapangan/data-tanaman/page';

interface FarmerListPanelProps {
  farmers: Farmer[];
  searchFarmer: string;
  setSearchFarmer: (val: string) => void;
  selectedFarmer: Farmer | null;
  onSelectFarmer: (farmer: Farmer) => void;
}

export default function FarmerListPanel({
  farmers,
  searchFarmer,
  setSearchFarmer,
  selectedFarmer,
  onSelectFarmer,
}: FarmerListPanelProps) {
  const filteredFarmers = farmers.filter((f) =>
    f.user?.name?.toLowerCase().includes(searchFarmer.toLowerCase())
  );

  return (
    <div className="lg:col-span-4 space-y-4">
      <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm space-y-3">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
          Langkah 1: Pilih Petani
        </span>
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-3.5 text-zinc-400 text-sm" />
          <input
            type="text"
            placeholder="Cari nama petani..."
            value={searchFarmer}
            onChange={(e) => setSearchFarmer(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition"
          />
        </div>
      </div>

      <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
        {filteredFarmers.map((farmer) => (
          <div
            key={farmer.id}
            onClick={() => onSelectFarmer(farmer)}
            className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between shadow-sm bg-white ${
              selectedFarmer?.id === farmer.id
                ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                : 'border-zinc-100 hover:border-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl text-sm ${
                  selectedFarmer?.id === farmer.id
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-zinc-50 text-zinc-400'
                }`}
              >
                <FaUserAlt />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-800">
                  {farmer.user?.name || 'Tanpa Nama'}
                </h4>
                <p className="text-xs text-zinc-400 font-medium">
                  {farmer.farmer_group?.name || 'Tanpa Kelompok'}
                </p>
              </div>
            </div>
          </div>
        ))}
        {filteredFarmers.length === 0 && (
          <p className="text-center text-xs text-zinc-400 py-4">Petani tidak ditemukan.</p>
        )}
      </div>
    </div>
  );
}