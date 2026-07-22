import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ValidasiPengadaanPage from "./page";
import api from "@/app/lib/axios";

// 1. Mock Axios API
jest.mock("@/app/lib/axios", () => ({
  get: jest.fn(),
}));

// 2. Mock Sub-Komponen Dinas
jest.mock(
  "@/app/components/dashboard/dinas/validasi/ValidasiStats",
  () => {
    return function MockValidasiStats({ stats }: { stats: any }) {
      return (
        <div data-testid="dinas-stats">
          Stats Dinas - Total: {stats.total}, Disetujui: {stats.disetujui}, Menunggu:{" "}
          {stats.menunggu}, Ditolak: {stats.ditolak}
        </div>
      );
    };
  }
);

jest.mock(
  "@/app/components/dashboard/dinas/validasi/ValidasiTable",
  () => {
    return function MockValidasiTable({ orders }: { orders: any[] }) {
      return (
        <div data-testid="dinas-table">
          Table Orders Count: {orders.length}
          {orders.map((o) => (
            <div key={o.id} data-testid="order-row">
              {o.po_number} - {o.cooperative?.name}
            </div>
          ))}
        </div>
      );
    };
  }
);

describe("ValidasiPengadaanPage Dinas Component (Page Integration Test)", () => {
  const mockProcurementOrders = [
    {
      id: 1,
      po_number: "PO-DINAS-001",
      status_verifikasi: "PENDING_DINAS",
      cooperative: { name: "Koperasi Tani Makmur" },
    },
    {
      id: 2,
      po_number: "PO-DINAS-002",
      status_verifikasi: "PENDING_KEMENKO", // Ini terhitung 'Disetujui' oleh Dinas
      cooperative: { name: "Koperasi Subur Sejahtera" },
    },
    {
      id: 3,
      po_number: "PO-DINAS-003",
      status_verifikasi: "APPROVED", // Ini juga terhitung 'Disetujui'
      cooperative: { name: "Koperasi Jaya" },
    },
    {
      id: 4,
      po_number: "PO-DINAS-004",
      status_verifikasi: "REJECTED_DINAS",
      cooperative: { name: "Koperasi Maju" },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("1. Menampilkan spinner loading saat sinkronisasi dokumen dari API", () => {
    // Gantung respon Axios
    (api.get as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<ValidasiPengadaanPage />);

    expect(screen.getByText("Sinkronisasi Dokumen...")).toBeInTheDocument();
  });

  it("2. Menghitung statistik verifikasi spesifik Dinas secara akurat", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: mockProcurementOrders },
    });

    render(<ValidasiPengadaanPage />);

    // Memastikan API dipanggil ke endpoint yang benar
    expect(api.get).toHaveBeenCalledWith("/cooperative/procurement");

    // Memastikan kalkulasi status khusus Dinas benar:
    // Total: 4, Disetujui (APPROVED + PENDING_KEMENKO): 2, Menunggu (PENDING_DINAS): 1, Ditolak (REJECTED_DINAS): 1
    await waitFor(() => {
      expect(screen.getByTestId("dinas-stats")).toHaveTextContent(
        "Stats Dinas - Total: 4, Disetujui: 2, Menunggu: 1, Ditolak: 1"
      );
      expect(screen.getByTestId("dinas-table")).toHaveTextContent(
        "Table Orders Count: 4"
      );
    });
  });

  it("3. Berhasil melakukan pencarian data berdasarkan No. PO / Nama Koperasi", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: mockProcurementOrders },
    });

    render(<ValidasiPengadaanPage />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByTestId("dinas-table")).toHaveTextContent(
        "Table Orders Count: 4"
      );
    });

    // Ketik kata kunci pada pencarian
    const searchInput = screen.getByPlaceholderText(
      /cari nama, nik petani, tanaman\.\.\.\./i
    );
    await user.type(searchInput, "Jaya");

    // Memastikan hanya 1 order yang muncul di tabel
    expect(screen.getByTestId("dinas-table")).toHaveTextContent(
      "Table Orders Count: 1"
    );
    expect(screen.getByText(/PO-DINAS-003 - Koperasi Jaya/i)).toBeInTheDocument();
  });

  it("4. Menangani kondisi saat API mengembalikan error secara aman", async () => {
    // Console error di-suppress agar log terminal tetap bersih
    const spyConsole = jest.spyOn(console, "error").mockImplementation(() => {});

    (api.get as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));

    render(<ValidasiPengadaanPage />);

    await waitFor(() => {
      // Loading hilang & tampilan utama dirender dengan aman
      expect(screen.queryByText("Sinkronisasi Dokumen...")).not.toBeInTheDocument();
    });

    spyConsole.mockRestore();
  });
});