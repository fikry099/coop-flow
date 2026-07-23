'use client';

import React, { useState, useEffect } from 'react';
import { getWeatherData } from '@/app/services/weatherService';

interface FarmerHeaderProps {
  name: string;
  role: string;
  avatar: string | null;
}

export default function FarmerHeader({ name, role, avatar }: FarmerHeaderProps) {
  const [weather, setWeather] = useState<any>(null);
  const [greeting, setGreeting] = useState<string>('Selamat Pagi');

  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 4 && currentHour < 11) setGreeting('Selamat Pagi');
    else if (currentHour >= 11 && currentHour < 15) setGreeting('Selamat Siang');
    else if (currentHour >= 15 && currentHour < 18.5) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');

    // Weather Fetching
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          getWeatherData(pos.coords.latitude, pos.coords.longitude).then((data) => {
            if (data) setWeather(data);
          });
        },
        () => {
          getWeatherData(-7.77, 110.37).then((data) => {
            if (data) setWeather(data);
          });
        }
      );
    }
  }, []);

  return (
    /* Card Container Utama: Padding diperbesar, latar dibuat lebih terang dan berdedikasi */
    <div className="bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-green-100/80 border-2 border-emerald-300/80 rounded-3xl p-4 shadow-sm flex items-center justify-between gap-3">
      
      {/* Kiri: Avatar & Info Profil */}
      <div className="flex items-center space-x-3.5 min-w-0">
        {/* Ukuran Foto Profil Diperbesar ke w-14 h-14 (56px) */}
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white p-0.5 border-2 border-emerald-600/40 shadow-xs flex-shrink-0">
          <img
            src={avatar || '/default-avatar.png'}
            alt={name}
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => {
              (e.target as HTMLElement).setAttribute(
                'src',
                'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=059669&color=fff'
              );
            }}
          />
        </div>

        {/* Informasi Teks dibuat Lebih Besar & Kontras */}
        <div className="min-w-0">
          <p className="text-xs font-bold text-emerald-800 tracking-wide">
            {greeting},
          </p>
          <h1 className="text-lg font-black text-slate-900 leading-snug truncate">
            {name}
          </h1>
          <span className="inline-block mt-1 bg-emerald-700 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-lg shadow-2xs">
            {role}
          </span>
        </div>
      </div>

      {/* Kanan: Widget Cuaca Mini (Font & Icon Lebih Jelas) */}
      <div className="bg-white/95 backdrop-blur-md border border-emerald-200 rounded-2xl px-3.5 py-2 shadow-xs flex items-center space-x-2 flex-shrink-0">
        <div className="text-right">
          <p className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider leading-tight">
            Cuaca
          </p>
          <p className="text-sm font-black text-emerald-950">
            {weather ? `${Math.round(weather.main.temp)}°C` : '--°C'}
          </p>
        </div>
        {weather ? (
          <img
            src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}.png`}
            alt="weather"
            className="w-9 h-9 object-contain"
          />
        ) : (
          <div className="w-8 h-8 bg-emerald-100 rounded-full animate-pulse" />
        )}
      </div>

    </div>
  );
}