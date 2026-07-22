'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaMapMarkerAlt, FaSeedling, FaGlobeAsia } from 'react-icons/fa';

interface LandsViewProps {
  lands: Array<any>;
}

export default function LandsView({ lands }: LandsViewProps) {
  const router = useRouter();

  const getPlantEmoji = (plantName: string): string => {
    const name = plantName?.toLowerCase() || '';
    if (name.includes('padi')) return '🌾';
    if (name.includes('jagung')) return '🌽';
    if (name.includes('cabai') || name.includes('cabe')) return '🌶️';
    if (name.includes('bawang')) return '🧅';
    if (name.includes('tomat')) return '🍅';
    return '🌱';
  };

  return (
    <div className="w-full max-w-full space-y-3 box-border overflow-hidden">
      
      {/* Sub Header */}
      <div className="flex items-center gap-2.5 py-2 border-b border-slate-200 bg-slate-50 sticky top-0 z-10 w-full min-w-0">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition active:scale-95 shrink-0 shadow-xs flex items-center justify-center"
          aria-label="Kembali"
        >
          <FaArrowLeft className="text-slate-800 text-xs" />
        </button>
        <div className="w-0 flex-1 min-w-0">
          <h1 className="font-extrabold text-slate-900 text-sm leading-tight truncate">Lahan & Tanaman Saya</h1>
          <p className="text-[10px] text-slate-500 font-medium truncate">Kelola data lahan dan pemupukan</p>
        </div>
      </div>

      {/* List Card Lahan */}
      <div className="space-y-3 w-full box-border min-w-0">
        {lands && lands.length > 0 ? (
          lands.map((land) => (
            <div 
              key={land.id} 
              className="w-full bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 box-border overflow-hidden min-w-0"
            >
              
              {/* Header Card Lahan */}
              <div className="flex items-center justify-between gap-2 w-full min-w-0">
                <div className="flex items-center gap-2 w-0 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                    <FaGlobeAsia className="text-sm" />
                  </div>
                  <div className="w-0 flex-1 min-w-0">
                    <h2 className="font-extrabold text-slate-900 text-xs leading-tight truncate">
                      {land.land_name}
                    </h2>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium truncate">
                      <FaMapMarkerAlt className="text-emerald-600 text-[9px] shrink-0" /> 
                      <span className="truncate">{land.location_address || 'Lokasi Lahan'}</span>
                    </p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  {land.status || 'Aktif'}
                </span>
              </div>

              {/* Ringkasan Luas Lahan & Jumlah Tanaman */}
              <div className="w-full bg-slate-50 p-2.5 rounded-xl text-[11px] space-y-1 border border-slate-200/60 font-medium box-border min-w-0">
                <div className="flex justify-between items-center gap-2 min-w-0">
                  <span className="text-slate-500 shrink-0">Luas Lahan</span>
                  <span className="font-extrabold text-slate-900 truncate text-right shrink-0">{land.area} {land.unit}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/80 pt-1 gap-2 min-w-0">
                  <span className="text-slate-500 shrink-0">Jumlah Tanaman</span>
                  <span className="font-extrabold text-emerald-700 truncate text-right shrink-0">
                    {land.plants ? `${land.plants.length} Jenis Tanaman` : '0 Jenis Tanaman'}
                  </span>
                </div>
              </div>

              {/* Daftar Tanaman */}
              <div className="space-y-2 pt-0.5 w-full box-border min-w-0">
                <p className="text-[11px] font-extrabold text-slate-800 px-0.5 flex items-center gap-1.5">
                  <FaSeedling className="text-emerald-600 text-xs" /> Daftar Tanaman:
                </p>
                
                {land.plants && land.plants.length > 0 ? (
                  land.plants.map((plant: any) => (
                    <div 
                      key={plant.id} 
                      className="w-full bg-emerald-50/60 border border-emerald-200/80 p-2.5 rounded-xl space-y-2 shadow-xs box-border overflow-hidden min-w-0"
                    >
                      {/* Baris Atas */}
                      <div className="flex items-center justify-between gap-1.5 w-full min-w-0">
                        <div className="flex items-center gap-2 w-0 flex-1 min-w-0">
                          <div className="w-7 h-7 rounded-lg border border-emerald-200 bg-white flex items-center justify-center text-xs shrink-0">
                            {getPlantEmoji(plant.name)}
                          </div>
                          <div className="w-0 flex-1 min-w-0">
                            <h3 className="font-extrabold text-emerald-950 text-xs capitalize truncate">
                              {plant.name}
                            </h3>
                            <p className="text-[9px] text-slate-600 font-medium truncate">
                              Tgl Tanam: <span className="font-bold text-slate-900">{plant.planting_date || '-'}</span>
                            </p>
                          </div>
                        </div>

                        <span className="bg-emerald-200/90 text-emerald-900 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0">
                          {plant.current_phase || 'Fase Tanam'}
                        </span>
                      </div>

                      {/* Tombol Action */}
                      <button
                        onClick={() => router.push(`/petani/pupuk/ajukan?plant_id=${plant.id}&land_id=${land.id}`)}
                        className="w-full bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-[11px] font-extrabold py-2 rounded-lg transition active:scale-[0.98] text-center block"
                      >
                        Pupuk Sekarang
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="w-full bg-slate-50 border border-dashed border-slate-200 p-2 rounded-xl text-center">
                    <p className="text-[10px] text-slate-400 italic font-medium">Belum ada tanaman terdaftar di lahan ini.</p>
                  </div>
                )}
              </div>

            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 text-center py-8 italic">Belum ada data lahan terdaftar.</p>
        )}
      </div>
    </div>
  );
}