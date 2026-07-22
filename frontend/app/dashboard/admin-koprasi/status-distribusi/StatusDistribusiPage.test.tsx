import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StatusDistribusiPage from "./page";
import api from "@/app/lib/axios";
import Swal from "sweetalert2";

// 1. Mock Axios API
jest.mock("@/app/lib/axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

// 2. Mock SweetAlert2
jest.mock("sweetalert2", () => {
  const fireMock = jest.fn();
  const mixinMock = jest.fn().mockReturnValue({ fire: fireMock });
  return {
    mixin: mixinMock,
    fire: fireMock,
  };
});

// 3. Interface Type Definition untuk Sub-Komponen
interface OverviewProps {
  totalPengajuan: number;
  disetujuiCount: number;
}

interface OrderItem {
  id: number;
  po_number: string;
}

interface TrackerProps {
  order: OrderItem;
  onCompleteOrder: (id: number) => void;
}

interface TableProps {
  orders: OrderItem[];
  onSelectOrder: (order: OrderItem) => void;
}

interface SummaryCardProps {
  totalTon: string;
  totalBags: number;
}

// 4. Mock Sub-Komponen dengan Type-Safety
jest.mock("@/app/components/dashboard/admin-koperasi/procurement/ProcurementOverview", () => {
  return function MockOverview({ totalPengajuan, disetujuiCount }: OverviewProps) {
    return (
      <div data-testid="procurement-overview">
        Total Pengajuan: {totalPengajuan}, Disetujui: {disetujuiCount}
      </div>
    );
  };
});

jest.mock("@/app/components/dashboard/admin-koperasi/procurement/ProcurementTracker", () => {
  return function MockTracker({ order, onCompleteOrder }: TrackerProps) {
    return (
      <div data-testid="procurement-tracker">
        Tracker Active for: {order.po_number}
        <button onClick={() => onCompleteOrder(order.id)}>Konfirmasi Terima Fisik</button>
      </div>
    );
  };
});

jest.mock("@/app/components/dashboard/admin-koperasi/procurement/ProcurementTable", () => {
  return function MockTable({ orders, onSelectOrder }: TableProps) {
    return (
      <div data-testid="procurement-table">
        Orders Count: {orders.length}
        {orders.map((o) => (
          <button key={o.id} onClick={() => onSelectOrder(o)}>
            Pilih {o.po_number}
          </button>
        ))}
      </div>
    );
  };
});

jest.mock("@/app/components/dashboard/admin-koperasi/procurement/DistributionSummaryCard", () => {
  return function MockSummaryCard({ totalTon, totalBags }: SummaryCardProps) {
    return (
      <div data-testid="distribution-summary-card">
        Tersalurkan: {totalTon} Ton ({totalBags} Bag)
      </div>
    );
  };
});

jest.mock("@/app/components/dashboard/admin-koperasi/procurement/DistributionBanner", () => {
  return function MockBanner() {
    return <div data-testid="distribution-banner">Banner Distribusi</div>;
  };
});

describe("StatusDistribusiPage Integration Tests", () => {
  const mockProcurementOrders = [
    {
      id: 1,
      po_number: "PO-DIST-001",
      periode_pengadaan: "Juli 2026",
      status_verifikasi: "APPROVED",
      status_logistik: "SELESAI",
      total_items: 2,
      total_weight_kg: 2000,
      total_bags_ordered: 40,
      created_at: "2026-07-01T00:00:00.000Z",
    },
    {
      id: 2,
      po_number: "PO-DIST-002",
      periode_pengadaan: "Juli 2026",
      status_verifikasi: "PENDING_DINAS",
      status_logistik: "NONE",
      total_items: 1,
      total_weight_kg: 1000,
      total_bags_ordered: 20,
      created_at: "2026-07-05T00:00:00.000Z",
    },
    {
      id: 3,
      po_number: "PO-DIST-003",
      periode_pengadaan: "Juli 2026",
      status_verifikasi: "REJECTED_DINAS",
      status_logistik: "NONE",
      total_items: 1,
      total_weight_kg: 500,
      total_bags_ordered: 10,
      created_at: "2026-07-10T00:00:00.000Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "/cooperative/procurement") {
        return Promise.resolve({ data: { success: true, data: mockProcurementOrders } });
      }
      if (url === "/cooperative/procurement/1") {
        return Promise.resolve({ data: { success: true, data: mockProcurementOrders[0] } });
      }
      return Promise.resolve({ data: { success: false } });
    });
  });

  it("1. Mengambil data pengadaan saat mount dan merender statistik & ringkasan tonase", async () => {
    render(<StatusDistribusiPage />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/cooperative/procurement");
      expect(screen.getByTestId("procurement-overview")).toHaveTextContent("Total Pengajuan: 3, Disetujui: 1");
      expect(screen.getByTestId("distribution-summary-card")).toHaveTextContent("Tersalurkan: 2.0 Ton (40 Bag)");
    });
  });

  it("2. Berhasil memfilter order berdasarkan Tab 'Disetujui' dan 'Ditolak'", async () => {
    render(<StatusDistribusiPage />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByTestId("procurement-table")).toHaveTextContent("Orders Count: 3");
    });

    // Klik Tab Disetujui
    await user.click(screen.getByRole("button", { name: "Disetujui" }));
    expect(screen.getByTestId("procurement-table")).toHaveTextContent("Orders Count: 1");

    // Klik Tab Ditolak
    await user.click(screen.getByRole("button", { name: "Ditolak" }));
    expect(screen.getByTestId("procurement-table")).toHaveTextContent("Orders Count: 1");
  });

  it("3. Mengambil detail order (GET /cooperative/procurement/{id}) saat order dipilih dari tabel", async () => {
    render(<StatusDistribusiPage />);
    const user = userEvent.setup();

    // Tunggu sampai tombol pilihan order benar-benar dirender di DOM setelah fetch API selesai
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /pilih po-dist-001/i })).toBeInTheDocument();
    });

    // Klik Order PO-DIST-001
    await user.click(screen.getByRole("button", { name: /pilih po-dist-001/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/cooperative/procurement/1");
      expect(screen.getByTestId("procurement-tracker")).toHaveTextContent("Tracker Active for: PO-DIST-001");
    });
  });

  it("4. Memicu konfirmasi penerimaan fisik pupuk (POST /cooperative/procurement/{id}/complete)", async () => {
    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: true });
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { success: true, message: "Pengadaan selesai!" },
    });

    render(<StatusDistribusiPage />);
    const user = userEvent.setup();

    // Tunggu sampai tombol pilihan order dirender
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /pilih po-dist-001/i })).toBeInTheDocument();
    });

    // Buka tracker
    await user.click(screen.getByRole("button", { name: /pilih po-dist-001/i }));

    await waitFor(() => {
      expect(screen.getByTestId("procurement-tracker")).toBeInTheDocument();
    });

    // Klik Konfirmasi Terima Fisik pada Tracker
    await user.click(screen.getByRole("button", { name: /konfirmasi terima fisik/i }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Konfirmasi Penerimaan Fisik" })
      );
      expect(api.post).toHaveBeenCalledWith("/cooperative/procurement/1/complete");
    });
  });
});