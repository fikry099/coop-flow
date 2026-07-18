"use client";

import React, { useState, useEffect } from "react";
import OverviewContent from "../../components/dashboard/admin-koperasi/OverViewContent";
import api from "../../lib/axios";

// Komponen Sub-Skeleton untuk menjaga kerapian kode
function DashboardSkeleton() {
  return (
    <div className="w-full space-y-6 -mt-2.5 animate-pulse">
      
      {/* 1. SKELETON: Greeting Banner */}
      <div className="w-full h-36 bg-slate-200 rounded-3xl" />

      {/* 2. SKELETON: Widget 6 Ringkasan Angka Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 w-full">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 h-28 flex flex-col justify-between" >
            <div className="space-y-2">
              <div className="h-3 w-16 bg-slate-200 rounded" />
              <div className="h-6 w-24 bg-slate-200 rounded" />
            </div>
            <div className="h-3 w-20 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* 3. SKELETON: AI Predictions Banner */}
      <div className="w-full h-16 bg-white border border-slate-100 rounded-2xl" />

      {/* 4. SKELETON: Konten Utama Ekosistem (Grid 2:1) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* KOLOM KIRI (xl:col-span-2) */}
        <div className="xl:col-span-2 space-y-6 flex flex-col">
          {/* Peta Sebaran */}
          <div className="w-full h-[460px] bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-4">
            <div className="space-y-2">
              <div className="h-4 w-48 bg-slate-200 rounded" />
              <div className="h-3 w-32 bg-slate-100 rounded" />
            </div>
            <div className="flex-1 w-full bg-slate-100 rounded-xl" />
          </div>

          {/* Grid 2 Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 h-[320px] flex flex-col gap-4">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="flex-1 bg-slate-50 rounded-xl" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-6 h-[320px] flex flex-col gap-4">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="flex-1 bg-slate-50 rounded-xl" />
            </div>
          </div>

          {/* Kondisi Stok Gudang (Bulan Ini) */}
          <div className="w-full bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
            <div className="h-4 w-56 bg-slate-200 rounded" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="h-3 w-16 bg-slate-200 rounded" />
                  <div className="flex-1 h-4 bg-slate-100 rounded" />
                  <div className="h-3 w-12 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN (xl:col-span-1) */}
        <div className="xl:col-span-1 space-y-6">
          {/* Kondisi Stok Gudang Utama */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-5">
            <div className="h-4 w-44 bg-slate-200 rounded" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-20 bg-slate-200 rounded" />
                    <div className="h-3 w-12 bg-slate-200 rounded" />
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Aktifitas Terbaru */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-5">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-3/4 bg-slate-200 rounded" />
                      <div className="h-2 w-1/2 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="h-2 w-12 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function DashboardOverviewPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

        const response = await api.get("/cooperative/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setDashboardData(response.data);
        }
      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return <OverviewContent data={dashboardData} />;
}