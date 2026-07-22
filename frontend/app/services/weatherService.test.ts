import axios from "axios";

// Standard Mocking
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Weather Service Unit Tests", () => {
  const originalConsoleError = console.error;
  let getWeatherData: typeof import("./weatherService").getWeatherData;
  let getHistoricalWeatherML: typeof import("./weatherService").getHistoricalWeatherML;

  beforeAll(() => {
    // 1. Set environment variable
    process.env.NEXT_PUBLIC_WEATHER_API_KEY = "580138b622128076fd1b6a3651c6a59d";

    // 2. Import dinamis untuk memastikan env disuntikkan sebelum modul dievaluasi
    const weatherService = require("./weatherService");
    getWeatherData = weatherService.getWeatherData;
    getHistoricalWeatherML = weatherService.getHistoricalWeatherML;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  describe("getWeatherData (OpenWeatherMap)", () => {
    it("1. Mengembalikan data cuaca harian dari API OpenWeatherMap saat sukses", async () => {
      const mockApiResponse = {
        data: {
          main: { temp: 28.5, humidity: 80 },
          weather: [{ description: "berawan" }],
        },
      };
      mockedAxios.get.mockResolvedValueOnce(mockApiResponse);

      const result = await getWeatherData(-7.123, 107.456);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("https://api.openweathermap.org/data/2.5/weather")
      );
      expect(result).toEqual(mockApiResponse.data);
    });

    it("2. Mengembalikan null dan menangani error jika koneksi API gagal", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));

      const result = await getWeatherData(-7.123, 107.456);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("getHistoricalWeatherML (Open-Meteo Aggregator)", () => {
    it("3. Berhasil menghitung rata-rata suhu, kelembapan, dan curah hujan bulanan secara akurat", async () => {
      const mockDailyData = {
        data: {
          daily: {
            time: ["2023-01-01", "2023-01-02", "2023-01-03"],
            temperature_2m_mean: [25.0, 26.0, 27.0], // Avg = 26.0
            relative_humidity_2m_mean: [80, 82, 84], // Avg = 82
            precipitation_sum: [120, 240, 0],       // Total = 360
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockDailyData);

      const result = await getHistoricalWeatherML(-7.123, 107.456, 1);

      expect(result).not.toBeNull();
      expect(result).toEqual({
        avg_temperature: 26.0,
        avg_humidity: 82,
        avg_monthly_precipitation: 30, // 360 total mm / 12 bulan = 30
        total_days_analyzed: 3,
      });
    });

    it("4. Mengembalikan null jika struktur response data daily dari Open-Meteo tidak valid", async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: {} });

      const result = await getHistoricalWeatherML(-7.123, 107.456, 3);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
});