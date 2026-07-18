"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";

// Perbaikan bug default icon Leaflet di Next.js
import "leaflet/dist/leaflet.css";

const iconKebutuhan: Record<string, L.DivIcon> = {
  Tinggi: L.divIcon({
    html: `<div class="w-6 h-6 bg-rose-500 rounded-full border-2 border-white shadow-md animate-pulse"></div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),
  Sedang: L.divIcon({
    html: `<div class="w-6 h-6 bg-orange-500 rounded-full border-2 border-white shadow-md"></div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),
  Rendah: L.divIcon({
    html: `<div class="w-6 h-6 bg-emerald-500 rounded-full border-2 border-white shadow-md"></div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),
};

// Komponen internal untuk otomatis memposisikan peta ke tengah titik koordinat lahan terdaftar
function ChangeView({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && (bounds as any).length > 0) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [bounds, map]);
  return null;
}

export default function MapDistribusiContent({ geoData }: { geoData: any }) {
  const features = geoData?.features || [];
  
  // Koordinat default (Tengah Indonesia / Ranjeng) jika data koordinat database kosong
  const defaultCenter: [number, number] = [-6.3895, 108.2831]; 

  // Ambil semua koordinat lahan untuk hitung auto-zoom bounds
  const markers = features
    .filter((f: any) => f.geometry?.coordinates)
    .map((f: any) => {
      const [lng, lat] = f.geometry.coordinates;
      return L.latLng(lat, lng);
    });

  const bounds = markers.length > 0 ? L.latLngBounds(markers) : null;

  return (
    <div className="w-full h-full min-h-[250px] relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        className="w-full h-full absolute inset-0"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {bounds && <ChangeView bounds={bounds} />}

        {features.map((feature: any, idx: number) => {
          if (!feature.geometry?.coordinates) return null;
          const [lng, lat] = feature.geometry.coordinates;
          const { name, area, kebutuhan, land_id } = feature.properties;
          
          // Pilih marker sesuai tingkat kebutuhan pupuk
          const currentIcon = iconKebutuhan[kebutuhan] || iconKebutuhan["Rendah"];

          return (
            <Marker key={land_id || idx} position={[lat, lng]} icon={currentIcon}>
              <Popup>
                <div className="p-1 space-y-1 font-sans">
                  <h4 className="font-bold text-slate-800 text-sm">{name}</h4>
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p>Luas Lahan: <span className="font-semibold text-slate-700">{area} Ha</span></p>
                    <p className="flex items-center gap-1 mt-1">
                      Status Urgensi: 
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                        kebutuhan === 'Tinggi' ? 'bg-rose-500' : kebutuhan === 'Sedang' ? 'bg-orange-500' : 'bg-emerald-500'
                      }`}>
                        {kebutuhan}
                      </span>
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legenda Peta Tambahan */}
      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-200 shadow-sm z-[1000] text-[10px] font-bold space-y-1.5 text-slate-700">
        <p className="text-slate-400 uppercase tracking-wider text-[9px] mb-1">Status Kebutuhan</p>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" /> Tinggi (&gt; 2 Ha)
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" /> Sedang (1 - 2 Ha)
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Rendah (&lt; 1 Ha)
        </div>
      </div>
    </div>
  );
}