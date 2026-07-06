'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function getRandomColorById(id: number | string): string {
  const num = typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, '')) || 1;
  const colors = [
    '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#a855f7'
  ];
  return colors[num % colors.length];
}

interface LeafletMapInnerProps {
  currentGPS: [number, number];
  polygonCoords: [number, number][];
  onMapClick: (lat: number, lng: number) => void;
  activeLayer: 'esri' | 'google';
  zoomAction: { type: 'in' | 'out' | null; id: number };
  isFullscreen: boolean;
  allFarmersData?: any[]; 
  selectedLandId?: string | number | null; 
  onSelectLandDirectly?: (farmer: any, land: any) => void;
  activeTab: 'belum' | 'sudah';
}

function MapResizeHandler({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize({ animate: true });
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullscreen, map]);
  return null;
}

function MapZoomTrigger({ triggerZoom }: { triggerZoom: { type: 'in' | 'out' | null; id: number } }) {
  const map = useMap();
  useEffect(() => {
    if (triggerZoom.id === 0) return;
    if (triggerZoom.type === 'in') map.zoomIn(1, { animate: true });
    if (triggerZoom.type === 'out') map.zoomOut(1, { animate: true });
  }, [triggerZoom.id, map]);
  return null;
}

// PERBAIKAN TRANSISI: Ditambahkan filter presisi & pembatasan jarak pergerakan agar tidak goyang
function MapViewManager({ 
  center, 
  activeTab, 
  allFarmersData 
}: { 
  center: [number, number]; 
  activeTab: 'belum' | 'sudah'; 
  allFarmersData: any[] 
}) {
  const map = useMap();
  const lastTabRef = useRef<string>('');
  const dataLengthRef = useRef<number>(0);
  
  // Menyimpan posisi kamera terakhir untuk mendeteksi ambang batas pergerakan nyata (anti-jitter)
  const lastCameraCenterRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    const isTabChanged = lastTabRef.current !== activeTab;
    const isDataChanged = dataLengthRef.current !== allFarmersData.length;

    // Skenario A: Jika tab peta lahan yang SUDAH ada diakses
    if (activeTab === 'sudah' && allFarmersData.length > 0) {
      if (isTabChanged || isDataChanged) {
        const bounds = L.latLngBounds([]);
        let hasCoordinates = false;

        allFarmersData.forEach((farmer) => {
          const lands = Array.isArray(farmer.lands) ? farmer.lands : (farmer.land ? [farmer.land] : []);
          lands.forEach((land: any) => {
            if (land.polygon_coordinates && land.polygon_coordinates.length > 0) {
              land.polygon_coordinates.forEach((coord: [number, number]) => {
                bounds.extend(coord);
                hasCoordinates = true;
              });
            }
          });
        });

        if (hasCoordinates) {
          map.flyToBounds(bounds, { padding: [40, 40], duration: 1 });
          lastTabRef.current = activeTab;
          dataLengthRef.current = allFarmersData.length;
        }
      }
    } 
    // Skenario B: Jika dalam mode rekam lahan (tab BELUM), kelola kelancaran kamera GPS
    else if (activeTab === 'belum' && center && center[0] && center[1]) {
      if (isTabChanged) {
        // Saat pertama kali masuk tab, posisikan instan
        map.setView(center, 18, { animate: false });
        lastTabRef.current = activeTab;
        lastCameraCenterRef.current = center;
      } else {
        // Ambil koordinat GPS kamera saat ini
        const currentPos = L.latLng(center[0], center[1]);
        const lastPos = lastCameraCenterRef.current 
          ? L.latLng(lastCameraCenterRef.current[0], lastCameraCenterRef.current[1]) 
          : null;

        // Hitung jarak riil pergerakan surveyor dalam satuan Meter
        const distanceMoved = lastPos ? currentPos.distanceTo(lastPos) : 999;

        // HANYA GANTI POSISI JIKA BERGERAK LEBIH DARI 2.5 METER (Menghindari distorsi goyangan sensor GPS)
        if (distanceMoved > 2.5) {
          map.panTo(center, { 
            animate: true, 
            duration: 0.8, // Sedikit diperlambat agar transisi pan mulus tidak mengagetkan mata
            easeLinearity: 0.25
          });
          lastCameraCenterRef.current = center;
        }
      }
    }
  }, [center, activeTab, allFarmersData, map]);

  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LeafletMapInner({ 
  currentGPS, 
  polygonCoords, 
  onMapClick, 
  activeLayer, 
  zoomAction,
  isFullscreen,
  allFarmersData = [],
  selectedLandId = null,
  onSelectLandDirectly,
  activeTab
}: LeafletMapInnerProps) {
  return (
    <MapContainer
      center={currentGPS}
      zoom={18}
      scrollWheelZoom={true}
      zoomControl={false} 
      zoomAnimation={true}
      className="w-full h-full"
    >
      <MapViewManager center={currentGPS} activeTab={activeTab} allFarmersData={allFarmersData} />
      
      {activeTab === 'belum' && <MapClickHandler onMapClick={onMapClick} />}
      <MapResizeHandler isFullscreen={isFullscreen} />
      <MapZoomTrigger triggerZoom={zoomAction} />

      {activeLayer === 'esri' ? (
        <TileLayer
          attribution='&copy; Esri'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={22}
          keepBuffer={8} 
          updateWhenIdle={true} 
        />
      ) : (
        <TileLayer
          attribution='&copy; Google Maps Hybrid'
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          maxZoom={22}
          keepBuffer={8} 
          updateWhenIdle={true}
        />
      )}

      {activeTab === 'belum' && <Marker position={currentGPS} icon={DefaultIcon} />}

      {activeTab === 'sudah' && allFarmersData.map((farmer) => {
        const lands = Array.isArray(farmer.lands) ? farmer.lands : (farmer.land ? [farmer.land] : []);
        
        return lands.map((land: any) => {
          if (!land.polygon_coordinates || land.polygon_coordinates.length === 0) return null;

          const isCurrentlyActive = String(land.id) === String(selectedLandId);
          const landColor = getRandomColorById(land.id);

          return (
            <Polygon
              key={`land-${land.id}`}
              positions={land.polygon_coordinates}
              eventHandlers={{
                click: () => {
                  if (onSelectLandDirectly) {
                    onSelectLandDirectly(farmer, land);
                  }
                },
              }}
              pathOptions={{
                color: isCurrentlyActive ? '#f43f5e' : landColor,
                fillColor: isCurrentlyActive ? '#fda4af' : landColor,
                fillOpacity: isCurrentlyActive ? 0.7 : 0.4,
                weight: isCurrentlyActive ? 4 : 2,
                dashArray: isCurrentlyActive ? '2, 5' : undefined,
              }}
            >
              <Popup>
                <div className="p-1 text-zinc-900 min-w-[160px]">
                  <h4 className="font-extrabold text-sm border-b pb-1 text-zinc-800">
                    {land.land_name || 'Lahan Petani'}
                  </h4>
                  <table className="w-full text-xs mt-2 border-separate border-spacing-y-1">
                    <tbody>
                      <tr>
                        <td className="text-zinc-500 font-medium">Petani:</td>
                        <td className="font-bold text-zinc-800">{farmer.user?.name || farmer.name}</td>
                      </tr>
                      <tr>
                        <td className="text-zinc-500 font-medium">Luas:</td>
                        <td className="font-bold text-emerald-700">{land.area} Ha</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="mt-2 text-[10px] text-center font-bold text-indigo-600 bg-indigo-50 py-1 rounded">
                    {isCurrentlyActive ? '⚡ Sedang Dipilih' : '👉 Klik area untuk fokus'}
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        });
      })}

      {activeTab === 'belum' && (
        <>
          {polygonCoords.map((coord, idx) => (
            <Marker 
              key={`node-${idx}`} 
              position={coord} 
              icon={L.divIcon({
                className: 'bg-amber-400 border-2 border-white w-3 h-3 rounded-full shadow-md',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
              })}
            />
          ))}

          {polygonCoords.length > 0 && (
            <Polygon
              positions={polygonCoords}
              pathOptions={{
                color: '#10b981',
                fillColor: '#34d399',
                fillOpacity: 0.4,
                weight: 3,
                dashArray: polygonCoords.length < 3 ? '5, 5' : undefined,
              }}
            />
          )}
        </>
      )}
    </MapContainer>
  );
}