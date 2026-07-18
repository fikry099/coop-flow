"use client";

import dynamic from "next/dynamic";
import React from "react";

// Import MapDistribusiContent secara dinamis khusus di sisi client saja
const MapDistribusiContent = dynamic(
  () => import("./MapDistribusiContent"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 text-xs font-medium text-slate-400 animate-pulse">
        Memuat peta spasial ekosistem...
      </div>
    )
  }
);

export default function MapDistribusi({ geoData }: { geoData: any }) {
  // Jika database kosong, berikan fallback koordinat kosong agar peta tidak pecah
  const safeGeoData = geoData || { type: "FeatureCollection", features: [] };
  
  return <MapDistribusiContent geoData={safeGeoData} />;
}