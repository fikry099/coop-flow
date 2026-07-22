import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PenyaluranPage from "./page";
import api from "@/app/lib/axios";

// 1. Mock Axios API
jest.mock("@/app/lib/axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

// 2. Mock Sub-Komponen
jest.mock("@/app/components/dashboard/penyaluran/FarmerList", () => {
  return function MockFarmerList({ farmers, onSelectFarmer }: any) {
    return (
      <div data-testid="farmer-list">
        Count: {farmers.length}
        {farmers.map((f: any) => (
          <button key={f.id} onClick={() => onSelectFarmer(f)}>
            Pilih {f.user?.name}
          </button>
        ))}
      </div>
    );
  };
});

jest.mock("@/app/components/dashboard/penyaluran/FarmerDetailPanel", () => {
  return function MockFarmerDetailPanel({ farmer, onCheckout }: any) {
    return (
      <div data-testid="farmer-detail-panel">
        Detail Petani: {farmer.user?.name}
        <button
          onClick={() =>
            onCheckout({
              totalBags: 4,
              totalCost: 180000,
              totalKg: 200,
              items: [{ id: 1, name: "Urea Subsi", quantity: 4, price: 45000 }],
            })
          }
        >
          Lanjut Checkout
        </button>
      </div>
    );
  };
});

jest.mock("@/app/components/dashboard/penyaluran/TransactionPanel", () => {
  return function MockTransactionPanel({ farmerName, grandTotalCost, onBack, onSuccess }: any) {
    return (
      <div data-testid="transaction-panel">
        Checkout untuk: {farmerName} - Total: Rp{grandTotalCost}
        <button onClick={onBack}>Kembali ke Detail</button>

        <button onClick={onSuccess}>Konfirmasi Penyaluran Sukses</button>
      </div>
    );
  };
});

describe("PenyaluranPage Integration Tests", () => {
  const mockFarmers = [
    {
      id: 1,
      user_id: 101,
      nik: "3204011234560001",
      user: { id: 101, name: "Pak Slamet", address: "Kec. Soreang" },
      village: { name: "Sekarwangi" },
    },
    {
      id: 2,
      user_id: 102,
      nik: "3204011234560002",
      user: { id: 102, name: "Pak Sugeng", address: "Kec. Ciwidey" },
      village: { name: "Rawabogo" },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("1. Menampilkan Skeleton Loader lalu merender daftar petani dan otomatis memilih petani pertama", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: mockFarmers },
    });

    render(<PenyaluranPage />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/farmers");
      expect(screen.getByTestId("farmer-list")).toHaveTextContent("Count: 2");
      // Memastikan petani pertama (Pak Slamet) dipilih secara default
      expect(screen.getByTestId("farmer-detail-panel")).toHaveTextContent("Detail Petani: Pak Slamet");
    });
  });

  it("2. Berhasil mengganti petani yang dipilih saat item pada daftar petani diklik", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: mockFarmers },
    });

    render(<PenyaluranPage />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByTestId("farmer-list")).toBeInTheDocument();
    });

    // Klik Pak Sugeng
    await user.click(screen.getByRole("button", { name: /pilih pak sugeng/i }));

    // Detail panel memperbarui data ke Pak Sugeng
    expect(screen.getByTestId("farmer-detail-panel")).toHaveTextContent("Detail Petani: Pak Sugeng");
  });

  it("3. Berhasil berpindah ke mode Checkout/TransactionPanel dan kembali lagi", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: mockFarmers },
    });

    render(<PenyaluranPage />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByTestId("farmer-detail-panel")).toBeInTheDocument();
    });

    // Klik Lanjut Checkout
    await user.click(screen.getByRole("button", { name: /lanjut checkout/i }));

    // Mode berpindah ke Transaction Panel
    expect(screen.queryByTestId("farmer-detail-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("transaction-panel")).toHaveTextContent("Checkout untuk: Pak Slamet - Total: Rp180000");

    // Klik Kembali ke Detail
    await user.click(screen.getByRole("button", { name: /kembali ke detail/i }));

    // Kembali ke Detail Panel
    expect(screen.getByTestId("farmer-detail-panel")).toBeInTheDocument();
  });

  it("4. Mengembalikan mode ke Detail Panel setelah penyaluran berhasil (onSuccess)", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: mockFarmers },
    });

    render(<PenyaluranPage />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByTestId("farmer-detail-panel")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /lanjut checkout/i }));
    expect(screen.getByTestId("transaction-panel")).toBeInTheDocument();

    // Simulasi transaksi penyaluran selesai
    await user.click(screen.getByRole("button", { name: /konfirmasi penyaluran sukses/i }));

    // Otomatis reset ke mode detail
    expect(screen.getByTestId("farmer-detail-panel")).toBeInTheDocument();
  });

  it("5. Menampilkan tampilan Error saat koneksi server/API gagal", async () => {
    (api.get as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: "Koneksi ke database terputus." } },
    });

    render(<PenyaluranPage />);

    await waitFor(() => {
      expect(screen.getByText("Koneksi ke database terputus.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /coba lagi/i })).toBeInTheDocument();
    });
  });
});