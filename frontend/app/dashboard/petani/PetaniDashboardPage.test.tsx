import { render, screen, waitFor } from "@testing-library/react";
import PetaniDashboardPage from "./page";
import api from "@/app/lib/axios";
import { useSearchParams } from "next/navigation";

// 1. Mock Axios API
jest.mock("@/app/lib/axios", () => ({
  get: jest.fn(),
}));

// 2. Mock useSearchParams dari Next.js
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

// 3. Mock Sub-komponen UI
jest.mock("@/app/components/dashboard/petani/PetaniHeaderWeather", () => {
  return function MockHeader({ name }: { name: string }) {
    return <div data-testid="farmer-header">Header: {name}</div>;
  };
});

jest.mock("@/app/components/dashboard/petani/SummaryCards", () => {
  return function MockSummary() {
    return <div data-testid="summary-cards">Summary Cards Component</div>;
  };
});

jest.mock("@/app/components/dashboard/petani/QuickActions", () => {
  return function MockQuickMenu() {
    return <div data-testid="quick-menu">Quick Menu Component</div>;
  };
});

jest.mock("@/app/components/dashboard/petani/CalendarSection", () => {
  return function MockCalendar() {
    return <div data-testid="calendar-section">Calendar Section Component</div>;
  };
});

jest.mock("@/app/components/dashboard/petani/RecentActivities", () => {
  return function MockActivities() {
    return <div data-testid="recent-activities">Recent Activities Component</div>;
  };
});

jest.mock("@/app/components/dashboard/petani/LandsView", () => {
  return function MockLandsView({ lands }: { lands: any[] }) {
    return (
      <div data-testid="lands-view">
        Lands View - Total Lahan: {lands.length}
      </div>
    );
  };
});

describe("PetaniDashboardPage Component (Page Integration Test)", () => {
  const mockDashboardData = {
    profile: {
      name: "Pak Tani Supri",
      role: "PETANI_UTAMA",
      avatar: null,
      village: "Desa Sukamaju",
    },
    summary: {
      total_land_ha: 2.5,
      fertilizer_received_kg: 500,
      total_transactions: 3,
      main_commodity: "Padi IR64",
    },
    recent_activities: [],
    calendars: {
      planting: [],
      fertilizer: [],
    },
  };

  const mockGetSearchParams = (viewValue: string | null = null) => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (param: string) => (param === "view" ? viewValue : null),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("1. Menampilkan teks loading saat data dashboard sedang dimuat", () => {
    mockGetSearchParams(null);
    // Gantung Axios agar tetap status loading
    (api.get as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<PetaniDashboardPage />);

    expect(screen.getByText("Memuat data dashboard...")).toBeInTheDocument();
  });

  it("2. Menampilkan tampilan error jika API gagal mengambil data dashboard", async () => {
    mockGetSearchParams(null);
    (api.get as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: "Koneksi ke server terputus." } },
    });

    render(<PetaniDashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Koneksi ke server terputus.")
      ).toBeInTheDocument();
    });
  });

  it("3. Berhasil merender seluruh komponen Dashboard Petani saat data berhasil diambil", async () => {
    mockGetSearchParams(null);
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: mockDashboardData },
    });

    render(<PetaniDashboardPage />);

    // Memastikan API dipanggil ke endpoint yang benar
    expect(api.get).toHaveBeenCalledWith("/farmer/dashboard-summary");

    // Memastikan seluruh sub-komponen dashboard utama muncul
    await waitFor(() => {
      expect(screen.getByTestId("farmer-header")).toBeInTheDocument();
      expect(screen.getByText("Header: Pak Tani Supri")).toBeInTheDocument();
      expect(screen.getByTestId("summary-cards")).toBeInTheDocument();
      expect(screen.getByTestId("quick-menu")).toBeInTheDocument();
      expect(screen.getByTestId("calendar-section")).toBeInTheDocument();
      expect(screen.getByTestId("recent-activities")).toBeInTheDocument();
    });
  });

  it("4. Mengambil data lahan (/farmer/my-lands) dan menampilkan LandsView ketika URL memiliki param ?view=lands", async () => {
    mockGetSearchParams("lands"); // Query param ?view=lands

    const mockLands = [{ id: 1, name: "Lahan Padi Barat" }, { id: 2, name: "Lahan Jagung Timur" }];

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "/farmer/dashboard-summary") {
        return Promise.resolve({ data: { data: mockDashboardData } });
      }
      if (url === "/farmer/my-lands") {
        return Promise.resolve({ data: { data: mockLands } });
      }
      return Promise.reject(new Error("URL tidak valid"));
    });

    render(<PetaniDashboardPage />);

    // Memastikan kedua endpoint dipanggil
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/farmer/dashboard-summary");
      expect(api.get).toHaveBeenCalledWith("/farmer/my-lands");
    });

    // Memastikan LandsView yang dirender (bukan tampilan dashboard biasa)
    await waitFor(() => {
      expect(screen.getByTestId("lands-view")).toBeInTheDocument();
      expect(screen.getByText("Lands View - Total Lahan: 2")).toBeInTheDocument();
    });

    // Sub-komponen dashboard biasa harus TIDAK ada
    expect(screen.queryByTestId("summary-cards")).not.toBeInTheDocument();
  });
});