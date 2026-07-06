'use client';

import React from 'react';
import { FaSearch, FaUserAlt, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Farmer, Land } from '@/app/dashboard/admin-lapangan/validasi-lahan/page'; 

interface ValidationFarmerListProps {
  farmers: Farmer[];
  selectedFarmer: Farmer | null;
  selectedLand: Land | null;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onSelectLand: (farmer: Farmer, land: Land) => void;
  activeTab: 'belum' | 'sudah';
  setActiveTab: (tab: 'belum' | 'sudah') => void;
}

export default function ValidationFarmerList({
  farmers,
  selectedFarmer,
  selectedLand,
  searchTerm,
  setSearchTerm,
  onSelectLand,
  activeTab,
  setActiveTab
}: ValidationFarmerListProps) {
  
  // Memfilter petani dan sub-lahannya sesuai dengan tab aktif
  const filteredFarmers = farmers.map(farmer => {
    const filteredLands = farmer.lands?.filter(land => {
      // AMAN: Jika lahan ini sedang dalam proses seleksi aktif, kunci posisinya di layout agar tidak jumping/hilang mendadak
      if (selectedLand && selectedLand.id === land.id && selectedFarmer && selectedFarmer.id === farmer.id) {
        return true;
      }

      const hasMap = land.polygon_coordinates && land.polygon_coordinates.length > 0;
      return activeTab === 'sudah' ? hasMap : !hasMap;
    }) || [];

    return { ...farmer, lands: filteredLands };
  }).filter(f => {
    // Berikan kelonggaran jika petani ini menampung lahan yang sedang aktif dipilih agar layout tidak kolaps saat submit data berjalan
    const isCurrentActiveFarmer = selectedFarmer && selectedFarmer.id === f.id;
    if (f.lands.length === 0 && !isCurrentActiveFarmer) return false;
    
    const name = f.user?.name || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || f.nik.includes(searchTerm);
  });

  return (
    <div className="space-y-4">
      {/* TABS CONTROLLER */}
      <div className="bg-white p-1.5 rounded-2xl border border-zinc-100 shadow-sm grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('belum')}
          className={`py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'belum' 
              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
              : 'text-zinc-500 hover:bg-zinc-50'
          }`}
        >
          <FaTimesCircle />
          Belum Dimapping
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sudah')}
          className={`py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'sudah' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'text-zinc-500 hover:bg-zinc-50'
          }`}
        >
          <FaCheckCircle />
          Sudah Dimapping
        </button>
      </div>

      {/* SEARCH FIELD */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-3.5 text-zinc-400 text-sm" />
          <input
            type="text"
            placeholder={`Cari nama petani di tab ${activeTab === 'belum' ? 'belum' : 'sudah'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-zinc-200 rounded-xl text-sm focus:outline-none font-medium"
          />
        </div>
      </div>

      {/* RENDER LIST */}
      <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
        {filteredFarmers.length > 0 ? (
          filteredFarmers.map((farmer) => {
            const name = farmer.user?.name || 'Tidak Ada Nama';
            
            // Pengaman ekstra: Jika list tanah kosong tetapi render dipaksa lolos karena seleksi aktif, beri fallback array
            const targetLands = farmer.lands.length > 0 ? farmer.lands : (farmer.lands || []);
            if (targetLands.length === 0) return null;

            return (
              <div key={farmer.id} className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-zinc-50 text-zinc-500 rounded-xl mt-0.5">
                    <FaUserAlt className="text-sm" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-zinc-900">{name}</h3>
                    <p className="text-xs text-zinc-400 font-medium">
                      Grup: {farmer.farmer_group?.name || 'Tidak Ada Kelompok'}
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 space-y-2">
                  {targetLands.map((land) => {
                    const isSelected = selectedLand?.id === land.id && selectedFarmer?.id === farmer.id;
                    return (
                      <div 
                        key={land.id} 
                        className={`flex items-center justify-between p-2 bg-white rounded-lg border text-xs transition ${
                          isSelected ? 'border-green-500 ring-1 ring-green-500' : 'border-zinc-200'
                        }`}
                      >
                        <div className="truncate max-w-[60%] pl-1">
                          <p className="font-bold text-zinc-700 truncate">{land.land_name}</p>
                          <p className="text-[10px] text-zinc-400 truncate">{land.location_address || 'No Alamat'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded ${
                            isSelected && activeTab === 'belum' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : activeTab === 'sudah' ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-500'
                          }`}>
                            {land.area} Ha {isSelected && activeTab === 'belum' && '(Edit)'}
                          </span>
                          <button
                            type="button"
                            onClick={() => onSelectLand(farmer, land)}
                            className={`p-1.5 rounded-lg border transition ${
                              isSelected 
                                ? 'bg-green-600 border-green-600 text-white' 
                                : 'bg-white hover:bg-green-50 text-zinc-600 border-zinc-200'
                            }`}
                            title={activeTab === 'sudah' ? "Lihat/Edit Peta" : "Petakan Lahan Ini"}
                          >
                            <FaMapMarkerAlt className="text-[11px]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 bg-white border border-dashed rounded-2xl text-zinc-400 text-xs font-medium">
            Tidak ada data lahan yang {activeTab === 'belum' ? 'belum' : 'sudah'} dimapping.
          </div>
        )}
      </div>
    </div>
  );
}