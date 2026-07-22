'use client';

import React from 'react';
import { useRouter } from 'next/navigation'; // 👈 Import router Next.js
import { FaMapMarkerAlt, FaSeedling, FaWallet, FaHistory } from 'react-icons/fa';

export default function QuickMenu() {
  const router = useRouter();

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-extrabold text-slate-900">Menu</h2>

      <div className="grid grid-cols-2 gap-3">
        {/* Menu 1: Lahan (Mengubah URL parameter tanpa reload) */}
        <div className="bg-emerald-200/60 p-3.5 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="flex items-start space-x-2">
            <div className="p-2 bg-white rounded-xl text-emerald-700 shadow-xs">
              <FaMapMarkerAlt className="text-base" />
            </div>
            <div>
              <p className="font-extrabold text-xs text-slate-900">Lahan</p>
              <p className="text-[9px] text-slate-600">Lihat lahan milik saya</p>
            </div>
          </div>
          <button 
            onClick={() => router.push('?view=lands')} // 👈 URL berubah jadi ?view=lands
            className="w-full bg-white text-emerald-800 text-[10px] font-extrabold py-1.5 rounded-xl shadow-2xs hover:bg-emerald-50 transition cursor-pointer"
          >
            Lihat Lahan Saya
          </button>
        </div>

        {/* Menu 2: Pemupukan */}
        <div className="bg-amber-200/60 p-3.5 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="flex items-start space-x-2">
            <div className="p-2 bg-white rounded-xl text-amber-700 shadow-xs">
              <FaSeedling className="text-base" />
            </div>
            <div>
              <p className="font-extrabold text-xs text-slate-900">Pemupukan</p>
              <p className="text-[9px] text-slate-600">Lihat pemupukan saya</p>
            </div>
          </div>
          <button className="w-full bg-white text-amber-800 text-[10px] font-extrabold py-1.5 rounded-xl shadow-2xs hover:bg-emerald-50 transition cursor-pointer">
            Lihat Pemupukan
          </button>
        </div>

        {/* Menu 3: Riwayat Transaksi */}
        <div className="bg-fuchsia-200/60 p-3.5 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="flex items-start space-x-2">
            <div className="p-2 bg-white rounded-xl text-fuchsia-700 shadow-xs">
              <FaWallet className="text-base" />
            </div>
            <div>
              <p className="font-extrabold text-xs text-slate-900">Riwayat Transaksi</p>
              <p className="text-[9px] text-slate-600">Lihat riwayat transaksi saya</p>
            </div>
          </div>
          <button className="w-full bg-white text-fuchsia-800 text-[10px] font-extrabold py-1.5 rounded-xl shadow-2xs hover:bg-emerald-50 transition cursor-pointer">
            Lihat Riwayat
          </button>
        </div>

        {/* Menu 4: Riwayat Pemupukan */}
        <div className="bg-sky-200/60 p-3.5 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="flex items-start space-x-2">
            <div className="p-2 bg-white rounded-xl text-sky-700 shadow-xs">
              <FaHistory className="text-base" />
            </div>
            <div>
              <p className="font-extrabold text-xs text-slate-900">Riwayat Pemupukan</p>
              <p className="text-[9px] text-slate-600">Lihat riwayat pemupukan saya</p>
            </div>
          </div>
          <button className="w-full bg-white text-sky-800 text-[10px] font-extrabold py-1.5 rounded-xl shadow-2xs hover:bg-emerald-50 transition cursor-pointer">
            Lihat Riwayat
          </button>
        </div>
      </div>
    </div>
  );
}