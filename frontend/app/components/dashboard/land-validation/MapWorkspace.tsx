'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { FaTrash, FaPlus, FaExpand, FaCompress, FaLayerGroup, FaRedo } from 'react-icons/fa';
import Swal from 'sweetalert2'; 

import 'leaflet/dist/leaflet.css';

const LeafletMapInner = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-zinc-400 text-xs font-medium bg-zinc-800">
      Memuat modul peta spasial...
    </div>
  ),
});

interface MapWorkspaceProps {
  onPolygonChange?: (coordinates: [number, number][]) => void;
  initialPolygon?: [number, number][]; 
  allFarmersData?: any[]; 
  selectedLandId?: string | number | null; 
  onSelectLandDirectly?: (farmer: any, land: any) => void; 
  activeTab?: 'belum' | 'sudah';
  onTriggerReMapping?: () => void;
}

export default function MapWorkspace({ 
  onPolygonChange, 
  initialPolygon = [], 
  allFarmersData = [], 
  selectedLandId = null,
  onSelectLandDirectly,
  activeTab = 'belum',
  onTriggerReMapping
}: MapWorkspaceProps) {
  const [currentGPS, setCurrentGPS] = useState<[number, number]>([-7.72, 110.32]);
  const [polygonCoords, setPolygonCoords] = useState<[number, number][]>([]);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null); // State baru untuk akurasi asli
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeLayer, setActiveLayer] = useState<'esri' | 'google'>('esri');
  const [zoomAction, setZoomAction] = useState<{ type: 'in' | 'out' | null; id: number }>({ type: null, id: 0 });
  
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Efek untuk memuat polygon awal (jika data lahan sudah ada)
  useEffect(() => {
    if (initialPolygon && initialPolygon.length > 0) {
      setPolygonCoords(initialPolygon);
      setCurrentGPS(initialPolygon[0]);
    } else {
      setPolygonCoords([]);
    }
  }, [initialPolygon]);

  // PELACAKAN GPS ASLI & REAL-TIME
  useEffect(() => {
    // Jika sedang melihat lahan yang sudah ada, jangan lacak GPS agar peta tidak loncat-loncat
    if (initialPolygon && initialPolygon.length > 0) return;

    if (!("geolocation" in navigator)) {
      console.warn("Browser ini tidak mendukung Geolocation.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Update koordinat GPS secara real-time
        setCurrentGPS([latitude, longitude]);
        // Update akurasi dalam satuan meter langsung dari perangkat
        setGpsAccuracy(Math.round(accuracy));
      },
      (error) => {
        console.error("Gagal mendapatkan lokasi GPS:", error.message);
      },
      {
        enableHighAccuracy: true, // Memaksa perangkat menggunakan GPS hardware (Akurasi Tinggi)
        timeout: 5000,           // Update responsif tiap 5 detik jika ada perubahan posisi
        maximumAge: 0             // Menolak data lokasi yang tersimpan di cache (Harus Fresh)
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [initialPolygon]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleRecordPoint = () => {
    const updatedCoords = [...polygonCoords, currentGPS];
    setPolygonCoords(updatedCoords);
    if (onPolygonChange) onPolygonChange(updatedCoords);
  };

  const handleClearPolygon = () => {
    setPolygonCoords([]);
    if (onPolygonChange) onPolygonChange([]);
  };

  const handleMapTap = (lat: number, lng: number) => {
    if (activeTab === 'sudah') return; 
    
    const updatedCoords: [number, number][] = [...polygonCoords, [lat, lng]];
    setPolygonCoords(updatedCoords);
    if (onPolygonChange) onPolygonChange(updatedCoords);
  };

  const handleResetAndRemap = () => {
    if (onTriggerReMapping) {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true,
      });

      Toast.fire({
        icon: 'info',
        title: 'Mode Gambar Ulang Aktif. Silakan plot simpul koordinat baru.'
      });

      if (onPolygonChange) onPolygonChange([]); 
      onTriggerReMapping(); 
    }
  };

  const toggleFullscreen = () => {
    if (!workspaceRef.current) return;
    if (!document.fullscreenElement) {
      workspaceRef.current.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  // Fungsi pembantu untuk menentukan status sinyal berdasarkan akurasi meteran
  const getGpsStatusLabel = () => {
    if (activeTab === 'sudah') return "Mode Viewer Semua Lahan";
    if (gpsAccuracy === null) return "Mencari Isyarat GPS...";
    return `GPS Akurasi: ±${gpsAccuracy} Meter`;
  };
  
  return (
    <div 
      ref={workspaceRef}
      className={`bg-zinc-900 relative shadow-md overflow-hidden border border-zinc-700 transition-all ${
        isFullscreen ? 'w-screen h-screen rounded-none' : 'rounded-2xl h-[480px]'
      }`}
    >
      <div className="w-full h-full z-0">
        <LeafletMapInner 
          currentGPS={currentGPS} 
          polygonCoords={polygonCoords} 
          onMapClick={handleMapTap}
          activeLayer={activeLayer}
          zoomAction={zoomAction} 
          isFullscreen={isFullscreen} 
          allFarmersData={allFarmersData}
          selectedLandId={selectedLandId}
          onSelectLandDirectly={onSelectLandDirectly}
          activeTab={activeTab} 
        />
      </div>

      {/* Akurasi Info Top Left (Dinamis Berdasarkan Lokasi Pengguna) */}
      <div className="absolute top-4 left-4 z-[1000] bg-zinc-950/90 text-white p-3 rounded-xl text-xs font-semibold space-y-1.5 backdrop-blur-sm border border-zinc-700 shadow-lg">
        <div className="flex items-center gap-2 text-emerald-400">
          <div className={`h-2 w-2 rounded-full bg-emerald-400 ${activeTab !== 'sudah' && 'animate-ping'}`}></div>
          <span>{getGpsStatusLabel()}</span>
        </div>
        <p className="text-[10px] text-zinc-400 font-normal">
          Status Sinyal: {gpsAccuracy !== null && gpsAccuracy <= 10 ? 'Sangat Kuat (Bagus untuk Plotting)' : 'Mencari Akurasi Optimal'}
        </p>
        <p className="text-[10px] text-zinc-400 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
          {currentGPS[0].toFixed(6)}, {currentGPS[1].toFixed(6)}
        </p>
      </div>

      {/* Right Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-3">
        {activeTab === 'belum' && (
          polygonCoords.length >= 3 ? (
            <div className="bg-emerald-500/90 text-white border border-emerald-400 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm shadow-md">
              Poligon Terbentuk
            </div>
          ) : (
            <div className="bg-amber-500/90 text-white border border-amber-400 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm shadow-md">
              Butuh {3 - polygonCoords.length} Simpul Lagi
            </div>
          )
        )}

        <div className="bg-zinc-950/90 border border-zinc-700 p-1.5 rounded-xl flex flex-col gap-1.5 shadow-xl backdrop-blur-sm text-white w-10 items-center">
          <button
            type="button"
            onClick={() => setZoomAction(prev => ({ type: 'in', id: prev.id + 1 }))}
            className="w-7 h-7 flex items-center justify-center font-bold text-base bg-zinc-800 hover:bg-zinc-700 rounded-lg transition select-none"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoomAction(prev => ({ type: 'out', id: prev.id + 1 }))}
            className="w-7 h-7 flex items-center justify-center font-bold text-base bg-zinc-800 hover:bg-zinc-700 rounded-lg transition border-b border-zinc-700 pb-0.5 select-none"
          >
            -
          </button>

          <button
            type="button"
            onClick={() => setActiveLayer(prev => prev === 'esri' ? 'google' : 'esri')}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition text-xs ${
              activeLayer === 'google' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <FaLayerGroup size={11} />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-lg transition text-zinc-300"
          >
            {isFullscreen ? <FaCompress size={11} /> : <FaExpand size={11} />}
          </button>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] flex flex-col gap-2">
        {activeTab === 'belum' && (
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={handleRecordPoint}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 border border-emerald-500"
            >
              <FaPlus />
              <span>Rekam Simpul Koordinat ({polygonCoords.length})</span>
            </button>

            {polygonCoords.length > 0 && (
              <button
                type="button"
                onClick={handleClearPolygon}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold p-3 rounded-xl shadow-lg transition flex items-center justify-center border border-rose-500"
              >
                <FaTrash />
              </button>
            )}
          </div>
        )}

        {activeTab === 'sudah' && selectedLandId && polygonCoords.length > 0 && (
          <button
            type="button"
            onClick={handleResetAndRemap}
            className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xl transition flex items-center justify-center gap-2 border border-amber-400 uppercase tracking-wider"
          >
            <FaRedo className="text-xs" />
            <span>Hapus & Gambar Ulang Area Lahan Ini</span>
          </button>
        )}
      </div>
    </div>
  );
}