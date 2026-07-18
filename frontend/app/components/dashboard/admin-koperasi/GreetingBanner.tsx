'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { getWeatherData } from '@/app/services/weatherService'; 

interface GreetingBannerProps {
  formattedDate: string;
}

export default function GreetingBanner({ formattedDate }: GreetingBannerProps) {
  const [weather, setWeather] = useState<any>(null);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(true);
  const [greeting, setGreeting] = useState<string>('Selamat Datang');
  
  // State manajemen profil dinamis dari localStorage
  const [adminName, setAdminName] = useState<string>('Petugas Koperasi');
  const [cooperativeName, setCooperativeName] = useState<string>('Koperasi Desa');

  useEffect(() => {
    // 1. Integrasi Parsing Data JSON user_profile
    if (typeof window !== "undefined") {
      const storedProfile = localStorage.getItem("user_profile");
      if (storedProfile) {
        try {
          const parsedProfile = JSON.parse(storedProfile);
          
          // Set nama admin (Contoh hasil: Siti Aminah (Petugas Koperasi))
          if (parsedProfile.name) {
            setAdminName(parsedProfile.name);
          }
          
          // Set nama koperasi (Contoh hasil: Koperasi Desa Merah Putih Ranjeng)
          if (parsedProfile.cooperative?.name) {
            setCooperativeName(parsedProfile.cooperative.name);
          }
        } catch (error) {
          console.error("Gagal membaca struktur JSON user_profile:", error);
        }
      }
    }

    // 2. Logika Integrasi Cuaca & Geolocation
    const fetchWeather = (lat: number, lon: number) => {
      getWeatherData(lat, lon).then(data => {
        if (data) {
          setWeather(data);
          
          const weatherPayload = {
            temp: data.main.temp,
            humidity: data.main.humidity,
            windSpeed: data.wind?.speed,
            latitude: lat,
            longitude: lon,
            locationName: data.name,
            fetchedAt: new Date().toISOString(),
          };
          localStorage.setItem('current_validation_weather', JSON.stringify(weatherPayload));
        }
      });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLoadingLocation(false);
          fetchWeather(latitude, longitude);
        },
        (error) => {
          console.error("Gagal mendeteksi lokasi otomatis, menggunakan fallback:", error);
          setLoadingLocation(false);
          // Menggunakan titik fallback koordinat default internal koperasi (-6.1123, 106.2345)
          fetchWeather(-6.11234500, 106.23456700); 
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLoadingLocation(false);
      fetchWeather(-6.11234500, 106.23456700);
    }
  }, []);

  return (
    <div 
      className="w-full h-[180px] sm:h-[160px] rounded-2xl p-6 sm:px-10 flex flex-col sm:flex-row sm:items-center justify-between relative overflow-hidden bg-cover bg-center border border-slate-100 shadow-sm"
      style={{ backgroundImage: `url('/bannercooperative.png')` }}
    >
      {/* SISI KIRI: Ucapan & Identitas Koperasi Hasil Extrak DB */}
      <div className="z-10 flex flex-col justify-center h-full space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight">
          {greeting}, <span className="text-emerald-800">{adminName}</span>
        </h1>
        <p className="text-sm font-bold text-emerald-900/70">
          {cooperativeName}
        </p>
        
        {/* Info Tanggal Real-Time Sistem */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950/80 pt-2">
          <Calendar className="w-3.5 h-3.5 text-emerald-900" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* SISI KANAN: Card Cuaca Minimalis Glassmorphism */}
      <div className="z-10 mt-4 sm:mt-0 bg-white/40 backdrop-blur-md border border-white/40 px-6 py-4 rounded-2xl flex flex-col justify-center min-w-[180px] shadow-inner">
        <span className="text-[10px] font-extrabold text-emerald-950/60 uppercase tracking-wider block mb-1">
          Cuaca hari ini
        </span>

        {weather ? (
          <div className="flex items-center gap-2">
            <img 
              src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
              alt={weather.weather[0].description}
              className="w-10 h-10 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-2xl font-black text-emerald-950 leading-none">
                {Math.round(weather.main.temp)}°C
              </span>
              <span className="text-[10px] text-emerald-900/70 font-bold capitalize mt-0.5">
                {weather.weather[0].description}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-xs font-semibold text-emerald-950/50 animate-pulse py-1">
            {loadingLocation ? 'Mencari GPS...' : 'Sinkronisasi cuaca...'}
          </span>
        )}
      </div>
    </div>
  );
}