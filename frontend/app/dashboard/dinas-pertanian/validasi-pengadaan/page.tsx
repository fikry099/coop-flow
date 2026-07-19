"use client";

import React, { useEffect, useState } from "react";
import api from "@/app/lib/axios"; 
import ValidasiStats from "@/app/components/dashboard/dinas/validasi/ValidasiStats";
import ValidasiTable from "@/app/components/dashboard/dinas/validasi/ValidasiTable";
import { HiMagnifyingGlass, HiAdjustmentsHorizontal } from "react-icons/hi2";

export default function ValidasiPengadaanPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, disetujui: 0, menunggu: 0, ditolak: 0 });

  useEffect(() => {
    // Ambil data langsung menggunakan endpoint resource dari model Laravel
    api.get("/cooperative/procurement")
      .then((res) => {
        const data = res.data.data || [];
        setOrders(data);
        setFilteredOrders(data);

        // Pengolahan data statistik real-time
        const total = data.length;
        const disetujui = data.filter((o: any) => o.status_verifikasi === "APPROVED" || o.status_verifikasi === "PENDING_KEMENKO").length;
        const menunggu = data.filter((o: any) => o.status_verifikasi === "PENDING_DINAS").length;
        const ditolak = data.filter((o: any) => o.status_verifikasi === "REJECTED_DINAS").length;

        setStats({ total, disetujui, menunggu, ditolak });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat berkas verifikasi:", err);
        setLoading(false);
      });
  }, []);

  // Filter pencarian client-side instan
  useEffect(() => {
    const term = search.toLowerCase();
    const result = orders.filter((o: any) =>
      o.po_number.toLowerCase().includes(term) ||
      (o.cooperative?.name || "").toLowerCase().includes(term)
    );
    setFilteredOrders(result);
  }, [search, orders]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 space-y-3">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-emerald-600" />
        <span className="text-xs font-bold text-zinc-400 tracking-wider uppercase">Sinkronisasi Dokumen...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb & Title */}
      <div>
        <div className="text-xs text-zinc-400 font-semibold mb-1 flex items-center space-x-1">
          <span>Dashboard</span>
          <span>&gt;</span>
          <span className="text-zinc-600 font-bold">Validasi Pengadaan</span>
        </div>
        <h1 className="text-2xl font-black text-zinc-800 tracking-tight">Validasi Pengadaan</h1>
        <p className="text-xs text-zinc-400 font-semibold mt-0.5">Kelola validasi pengadaan pupuk</p>
      </div>

      {/* Komponen Statistik Grid */}
      <ValidasiStats stats={stats} />

      {/* Toolbar Pencarian & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <HiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input
            type="text"
            placeholder="Cari nama, NIK petani, tanaman...."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium placeholder-zinc-300"
          />
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-zinc-200 text-zinc-500 px-5 py-2 rounded-xl text-sm font-bold transition cursor-not-allowed">
          <HiAdjustmentsHorizontal className="text-base" />
          <span>Filter</span>
        </button>
      </div>

      {/* Komponen Tabel Utama */}
      <ValidasiTable orders={filteredOrders} />
    </div>
  );
}