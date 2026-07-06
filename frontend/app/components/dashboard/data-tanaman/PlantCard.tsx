'use client';

import React from 'react';
import { FaTrash, FaSeedling, FaCalendarAlt, FaMapMarkerAlt, FaEdit, FaChartArea } from 'react-icons/fa';
import { Land, Plant } from '@/app/dashboard/admin-lapangan/data-tanaman/page'; 

interface PlantCardProps {
  land: Land;
  onDeleteSinglePlant: (plantId: string | number) => void;
  onDeleteAllPlantsInLand: (landId: number, plantIds: (string | number)[]) => void;
  onEditPlant: (plant: Plant, landId: number) => void;
}

export default function PlantCard({ 
  land, 
  onDeleteSinglePlant, 
  onDeleteAllPlantsInLand, 
  onEditPlant 
}: PlantCardProps) {
  
  const plantList = land.plants || [];

  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md hover:border-emerald-200/60 transition-all duration-300 flex flex-col justify-between gap-5 group">
      
      {/* Header Nama Lahan & Tombol Hapus Semua */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-zinc-100">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Area Lahan
          </span>
          <h4 className="text-sm font-extrabold text-zinc-800 tracking-tight mt-1">
            {land.land_name || `Lahan #${land.id}`}
          </h4>
        </div>
        
        {/* Tombol Hapus Semua */}
        {plantList.length > 0 && (
          <button
            onClick={() => onDeleteAllPlantsInLand(land.id, plantList.map(p => p.id))}
            className="text-[10px] font-bold text-rose-600 bg-rose-50/60 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 active:scale-95"
            title="Hapus semua tanaman dari lahan ini"
          >
            <FaTrash className="text-[9px]" />
            <span>Kosongkan Lahan</span>
          </button>
        )}
      </div>

      {/* Konten Metadata Lahan */}
      <div className="grid grid-cols-2 gap-3 bg-zinc-50/50 p-3 rounded-xl border border-zinc-100 text-xs font-medium text-zinc-500">
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide flex items-center gap-1">
            <FaChartArea className="text-zinc-300" /> Luas Lahan
          </span>
          <span className="text-zinc-800 font-bold block">{land.area} Ha</span>
        </div>
        <div className="space-y-1 min-w-0">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide flex items-center gap-1">
            <FaMapMarkerAlt className="text-zinc-300" /> Lokasi
          </span>
          <span className="text-zinc-700 font-semibold block truncate" title={land.location_address}>
            {land.location_address || '-'}
          </span>
        </div>
      </div>

      {/* List Tanaman Aktif */}
      <div className="space-y-2.5 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">
            Komoditas Ditanam ({plantList.length})
          </span>
        </div>

        {plantList.length > 0 ? (
          <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1 custom-scrollbar">
            {plantList.map((plant) => (
              <div 
                key={plant.id} 
                className="p-3 flex items-center justify-between gap-3 bg-white border border-zinc-100 rounded-xl hover:border-zinc-200 shadow-sm hover:shadow transition-all duration-200 group/plant"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl text-xs bg-emerald-50 text-emerald-600 shrink-0 shadow-sm">
                    <FaSeedling />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-extrabold text-zinc-800 truncate">{plant.name}</p>
                    <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                      <FaCalendarAlt className="text-[9px] text-zinc-300" />
                      {plant.planting_date || '-'}
                    </span>
                  </div>
                </div>

                {/* Tombol Aksi - Muncul Halus saat Hover /plant */}
                <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-0 group-hover/plant:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => onEditPlant(plant, land.id)}
                    className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Edit varietas"
                  >
                    <FaEdit className="text-xs" />
                  </button>
                  <button
                    onClick={() => onDeleteSinglePlant(plant.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Hapus varietas ini"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-zinc-50/30 rounded-xl border border-dashed border-zinc-200/70 flex flex-col items-center justify-center">
            <FaSeedling className="text-zinc-300 text-lg mb-1.5 opacity-60" />
            <p className="text-[11px] text-zinc-400 italic font-medium">
              Belum ada varietas tanaman terdaftar
            </p>
          </div>
        )}
      </div>

      {/* Footer Koordinat Geografis */}
      <div className="flex items-center justify-between bg-zinc-50 border border-zinc-100 px-3 py-2 rounded-xl mt-1">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Polygon Pin</span>
        <span className="text-[10px] font-mono font-semibold text-zinc-600 truncate max-w-[145px] bg-white px-1.5 py-0.5 rounded border border-zinc-200/60 shadow-2xs">
          {land.polygon_coordinates?.[0]
            ? `${land.polygon_coordinates[0][0].toFixed(4)}, ${land.polygon_coordinates[0][1].toFixed(4)}`
            : 'Belum Terpetakan'}
        </span>
      </div>
    </div>
  );
}