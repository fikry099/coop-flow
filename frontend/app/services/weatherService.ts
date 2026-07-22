import axios from 'axios';

/**
 * 1. FUNGSI UNTUK WIDGET BANNER (REAL-TIME CUACA HARIAN)
 * Menggunakan OpenWeatherMap API (Membutuhkan API KEY)
 */
export const getWeatherData = async (lat: number, lon: number) => {
  // Ambil API KEY di dalam fungsi agar selalu membaca env terbaru saat dipanggil
  const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  try {
    if (!API_KEY) {
      console.error("API Key cuaca tidak ditemukan di environment variables");
      return null;
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil data cuaca harian:", error);
    return null;
  }
};

/**
 * 2. FUNGSI UNTUK INPUT MODEL MACHINE LEARNING (HISTORI CUACA MAKRO)
 * Menggunakan Open-Meteo Archive API (Gratis, Tanpa API Key, Mendukung Data Tahunan)
 */
export const getHistoricalWeatherML = async (lat: number, lon: number, yearsBack: number = 3) => {
  const endDate = new Date();
  const startDate = new Date();

  startDate.setFullYear(endDate.getFullYear() - yearsBack);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startStr}&end_date=${endStr}&daily=temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum&timezone=auto`;

  try {
    const response = await axios.get(url);
    const dailyData = response?.data?.daily;

    if (!dailyData || !Array.isArray(dailyData.time) || dailyData.time.length === 0) {
      throw new Error("Struktur data daily tidak ditemukan dari Open-Meteo");
    }

    const totalDays = dailyData.time.length;

    // --- PROSES AGREGASI & HITUNG RATA-RATA ---
    const totalTemp = (dailyData.temperature_2m_mean || []).reduce((acc: number, val: number) => acc + (val ?? 0), 0);
    const avgTemp = totalTemp / totalDays;

    const totalHumidity = (dailyData.relative_humidity_2m_mean || []).reduce((acc: number, val: number) => acc + (val ?? 0), 0);
    const avgHumidity = totalHumidity / totalDays;

    const totalPrecipitation = (dailyData.precipitation_sum || []).reduce((acc: number, val: number) => acc + (val ?? 0), 0);
    const totalMonths = yearsBack * 12;
    const avgMonthlyPrecipitation = totalPrecipitation / totalMonths;

    return {
      avg_temperature: Math.round(avgTemp * 10) / 10,
      avg_humidity: Math.round(avgHumidity),
      avg_monthly_precipitation: Math.round(avgMonthlyPrecipitation * 10) / 10,
      total_days_analyzed: totalDays
    };

  } catch (error) {
    console.error("Gagal mengambil data histori cuaca Open-Meteo untuk ML:", error);
    return null;
  }
};