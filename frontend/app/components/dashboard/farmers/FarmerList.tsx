'use client';

import React from 'react';
import { FaSearch, FaUserPlus, FaUserAlt } from 'react-icons/fa';

interface Farmer {
  id: number;
  user_id?: number;
  farmer_group_id?: number; // AMBIL ID
  farmer_group?: { id: number; name: string }; // AKOMODASI RELASI TERBARU DARI LARAVEL
  nik: string;
  total_land_area?: number;
  notes?: string;
  user?: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  name?: string;
  phone?: string;
  address?: string;
  status?: string;
}

interface FarmerListProps {
  farmers: Farmer[];
  selectedFarmer: Farmer | null;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onSelectFarmer: (farmer: Farmer) => void;
  onInitAdd: () => void;
}

export default function FarmerList({
  farmers,
  selectedFarmer,
  searchTerm,
  setSearchTerm,
  onSelectFarmer,
  onInitAdd
}: FarmerListProps) {
  
  const filteredFarmers = farmers.filter(f => {
    const name = f.user?.name || f.name || '';
    const nik = f.nik || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || nik.includes(searchTerm);
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-3.5 text-zinc-400 text-sm" />
          <input
            type="text"
            placeholder="Cari nama atau NIK petani..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition shadow-sm"
          />
        </div>
        <button 
          onClick={onInitAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-2 whitespace-nowrap"
        >
          <FaUserPlus />
          <span>Tambah</span>
        </button>
      </div>

      <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
        {filteredFarmers.map((farmer) => {
          const name = farmer.user?.name || farmer.name;
          // MODIFIKASI DISINI: Ambil nama kelompok tani dari objek relasi DB
          const groupName = farmer.farmer_group?.name || 'Belum Ada Kelompok Tani';
          
          return (
            <div 
              key={farmer.id}
              onClick={() => onSelectFarmer(farmer)}
              className={`bg-white p-4 rounded-2xl border transition flex flex-col justify-between gap-3 shadow-sm cursor-pointer ${
                selectedFarmer?.id === farmer.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-zinc-100 hover:border-zinc-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-zinc-50 text-zinc-500 rounded-xl mt-0.5">
                    <FaUserAlt className="text-sm" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-zinc-800">{name}</h3>
                    <p className="text-xs text-zinc-400 font-medium">NIK: {farmer.nik}</p>
                    {/* GUNAKAN NAMA KELOMPOK TANI DINAMIS */}
                    <p className="text-xs text-zinc-500 font-bold mt-1 text-blue-600">{groupName}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  farmer.status === 'Draft Lokal' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                }`}>
                  {farmer.status || 'Terverifikasi DB'}
                </span>
              </div>
            </div>
          );
        })}
        {filteredFarmers.length === 0 && (
          <p className="text-center text-sm text-zinc-400 py-6 font-medium">Data Petani tidak ditemukan.</p>
        )}
      </div>
    </div>
  );
}