// src/services/weatherService.ts
import axios from 'axios';

// Mengambil API Key dari file .env.local
const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

export const getWeatherData = async (lat: number, lon: number) => {
  try {
    // Kita tambahkan pengecekan agar tidak error jika API_KEY lupa diisi
    if (!API_KEY) {
      console.error("API Key cuaca tidak ditemukan di environment variables");
      return null;
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil data cuaca:", error);
    return null;
  }
};