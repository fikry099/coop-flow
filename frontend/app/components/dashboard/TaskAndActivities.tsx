'use client';

import React from 'react';
import LatestMap from './LatestMap'; 

export default function TaskAndActivities() {
  const dummyChartData = [
    { desa: 'Sukamaju', terverifikasi: 'h-[75%]', belum: 'h-[25%]', total: '45 Lahan' },
    { desa: 'Rariteng', terverifikasi: 'h-[50%]', belum: 'h-[50%]', total: '30 Lahan' },
  ];

  return (
    // items-stretch membuat tinggi box kiri otomatis mengunci mati setara box kanan yang sudah dirampingkan
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
      
      {/* 1. Visualisasi Progress Validasi Lahan (Porsi Lebar: 4) */}
      <div className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm lg:col-span-4 flex flex-col justify-between h-full">
        <div>
          <div className="flex justify-between items-center pb-1">
            <h3 className="text-sm font-bold text-zinc-800">Progress Validasi</h3>
            <span className="text-[9px] bg-zinc-100 text-zinc-600 font-bold px-2 py-0.5 rounded-full">Per Wilayah</span>
          </div>
          
          {/* Legend */}
          <div className="flex items-center space-x-3 my-1.5 text-[9px]">
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded bg-green-500" />
              <span className="text-zinc-500 font-medium">Terverifikasi</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded bg-zinc-200" />
              <span className="text-zinc-500 font-medium">Belum Disurvei</span>
            </div>
          </div>

          {/* Batang Diagram (Tinggi h-20 agar proporsional dengan peta baru) */}
          <div className="grid grid-cols-2 gap-8 h-20 items-end pt-1 border-b border-zinc-100 px-4">
            {dummyChartData.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center h-full justify-end group cursor-pointer">
                <span className="text-[9px] font-bold text-zinc-700 opacity-0 group-hover:opacity-100 transition mb-0.5">
                  {item.total}
                </span>
                
                <div className="w-full max-w-[45px] bg-zinc-100 rounded-t-md overflow-hidden h-14 flex flex-col justify-end">
                  <div className={`w-full bg-zinc-200 ${item.belum}`} />
                  <div className={`w-full bg-green-500 ${item.terverifikasi}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Label Sumbu X */}
          <div className="grid grid-cols-2 gap-8 text-center mt-1.5 px-4">
            {dummyChartData.map((item, idx) => (
              <span key={idx} className="text-[10px] font-bold text-zinc-600 truncate">
                {item.desa}
              </span>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-zinc-400 mt-3 italic text-center">
          *Data diperbarui real-time dari GIS.
        </div>
      </div>

      {/* 2. Peta Spasial GIS Terkini (Porsi Lebar: 8) */}
      <div className="lg:col-span-8 flex flex-col h-full">
        <LatestMap />
      </div>

    </div>
  );
}