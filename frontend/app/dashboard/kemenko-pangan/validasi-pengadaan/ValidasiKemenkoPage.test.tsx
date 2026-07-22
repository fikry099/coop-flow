import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ValidasiKemenkoPage from "./page";
import api from "@/app/lib/axios";
import { useRouter } from "next/navigation";

// 1. Mock Axios API
jest.mock("@/app/lib/axios", () => ({
  get: jest.fn(),
}));

// 2. Mock useRouter dari Next.js Navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// 3. Mock Sub-Komponen UI (ValidasiStats & ValidasiTable)
jest.mock(
  "@/app/components/dashboard/kemenko/validasi/ValidasiStats",
  () => {
    return function MockValidasiStats({ stats }: { stats: any }) {
      return (
        <div data-testid="validasi-stats">
          Stats - Total: {stats.total}, Disetujui: {stats.disetujui}, Menunggu:{" "}
          {stats.menunggu}, Ditolak: {stats.ditolak}
        </div>
      );
    };
  }
);

jest.mock(
  "@/app/components/dashboard/kemenko/validasi/ValidasiTable",
  () => {
    return function MockValidasiTable({ orders }: { orders: any[] }) {
      return (
        <div data-testid="validasi-table">
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

describe("ValidasiKemenkoPage Component (Page Integration Test)", () => {
  const mockBack = jest.fn();

  const mockProcurementOrders = [
    {
      id: 1,
      po_number: "PO-2026-001",
      status_verifikasi: "APPROVED",
      cooperative: { name: "Koperasi Tani Makmur" },
    },
    {
      id: 2,
      po_number: "PO-2026-002",
      status_verifikasi: "PENDING_KEMENKO",
      cooperative: { name: "Koperasi Subur Sejahtera" },
    },
    {
      id: 3,
      po_number: "PO-2026-003",
      status_verifikasi: "REJECTED_KEMENKO",
      cooperative: { name: "Koperasi Unit Desa" },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack,
    });
  });

  it("1. Menampilkan spinner loading saat data sedang dimuat dari API", () => {
    // Gantung respon Axios agar tetap dalam status loading
    (api.get as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<ValidasiKemenkoPage />);

    expect(screen.getByText("Sinkronisasi Dokumen...")).toBeInTheDocument();
  });

  it("2. Berhasil mengambil data, menghitung statistik, dan menampilkan tabel", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: mockProcurementOrders },
    });

    render(<ValidasiKemenkoPage />);

    // Memastikan API dipanggil ke endpoint yang benar
    expect(api.get).toHaveBeenCalledWith("/cooperative/procurement");

    // Memastikan data statistik dihitung dengan benar
    await waitFor(() => {
      expect(screen.getByTestId("validasi-stats")).toHaveTextContent(
        "Stats - Total: 3, Disetujui: 1, Menunggu: 1, Ditolak: 1"
      );
      expect(screen.getByTestId("validasi-table")).toHaveTextContent(
        "Table Orders Count: 3"
      );
    });
  });

  it("3. Berhasil memfilter daftar pesanan berdasarkan pencarian No. PO atau Nama Koperasi", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: mockProcurementOrders },
    });

    render(<ValidasiKemenkoPage />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByTestId("validasi-table")).toHaveTextContent(
        "Table Orders Count: 3"
      );
    });

    // Ketik pencarian berdasarkan nama Koperasi "Subur"
    const searchInput = screen.getByPlaceholderText(
      /cari no\. pengajuan atau nama koperasi\.\.\./i
    );
    await user.type(searchInput, "Subur");

    // Memastikan hanya 1 data yang lolos filter
    expect(screen.getByTestId("validasi-table")).toHaveTextContent(
      "Table Orders Count: 1"
    );
    expect(screen.getByText(/PO-2026-002 - Koperasi Subur Sejahtera/i)).toBeInTheDocument();
  });

  it("4. Memanggil router.back() ketika tombol kembali diklik", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: mockProcurementOrders },
    });

    render(<ValidasiKemenkoPage />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.queryByText("Sinkronisasi Dokumen...")).not.toBeInTheDocument();
    });

    // Klik tombol Kembali
    const backButton = screen.getByRole("button", { name: /kembali/i });
    await user.click(backButton);

    // Memastikan fungsi router.back() dipanggil
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});