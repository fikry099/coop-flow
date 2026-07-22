import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProcurementTracker from "./ProcurementTracker";

describe("ProcurementTracker Component", () => {
  const mockOnClose = jest.fn();
  const mockOnCompleteOrder = jest.fn();

  const baseOrder = {
    id: 101,
    po_number: "PO-2026-001",
    periode_pengadaan: "2026/2027",
    status_verifikasi: "PENDING_DINAS",
    status_logistik: "NONE",
    rejection_reason: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("1. Menampilkan nomor PO, periode, dan status order dengan benar", () => {
    render(
      <ProcurementTracker
        order={baseOrder}
        onClose={mockOnClose}
        onCompleteOrder={mockOnCompleteOrder}
      />
    );

    expect(screen.getByText("PO-2026-001")).toBeInTheDocument();
    expect(screen.getByText("2026/2027")).toBeInTheDocument();
    expect(screen.getByText("PENDING DINAS")).toBeInTheDocument();
  });

  it("2. Menandai langkah Ditolak jika status verifikasi adalah REJECTED_DINAS", () => {
    const rejectedOrder = {
      ...baseOrder,
      status_verifikasi: "REJECTED_DINAS",
      rejection_reason: "Berkas tidak lengkap dan salah kuota",
    };

    render(
      <ProcurementTracker
        order={rejectedOrder}
        onClose={mockOnClose}
        onCompleteOrder={mockOnCompleteOrder}
      />
    );

    // Memastikan teks 'Ditolak' pada langkah Verifikasi Dinas tampil
    expect(screen.getByText("Ditolak")).toBeInTheDocument();

    // Memastikan kotak alasan penolakan muncul di layar
    expect(
      screen.getByText(/berkas tidak lengkap dan salah kuota/i)
    ).toBeInTheDocument();
  });

  it("3. Menampilkan tombol 'Konfirmasi Bongkar Gudang' saat logistik SIAP_TEBUS_LINI_4 dan memanggil callback saat diklik", async () => {
    const readyForPickupOrder = {
      ...baseOrder,
      status_verifikasi: "APPROVED",
      status_logistik: "SIAP_TEBUS_LINI_4",
    };

    render(
      <ProcurementTracker
        order={readyForPickupOrder}
        onClose={mockOnClose}
        onCompleteOrder={mockOnCompleteOrder}
      />
    );

    const user = userEvent.setup();

    // Memastikan tombol Konfirmasi Bongkar Gudang muncul
    const confirmBtn = screen.getByRole("button", {
      name: /konfirmasi bongkar gudang/i,
    });
    expect(confirmBtn).toBeInTheDocument();

    // Klik tombol
    await user.click(confirmBtn);

    // Memastikan fungsi onCompleteOrder dipanggil dengan ID pesanan yang sesuai (101)
    expect(mockOnCompleteOrder).toHaveBeenCalledTimes(1);
    expect(mockOnCompleteOrder).toHaveBeenCalledWith(101);
  });

  it("4. Tidak menampilkan tombol konfirmasi jika status logistik belum SIAP_TEBUS_LINI_4", () => {
    const inProgressOrder = {
      ...baseOrder,
      status_verifikasi: "APPROVED",
      status_logistik: "PROD_LINI_1_2",
    };

    render(
      <ProcurementTracker
        order={inProgressOrder}
        onClose={mockOnClose}
        onCompleteOrder={mockOnCompleteOrder}
      />
    );

    // Tombol konfirmasi bongkar gudang seharusnya TIDAK ada
    expect(
      screen.queryByRole("button", { name: /konfirmasi bongkar gudang/i })
    ).not.toBeInTheDocument();
  });
});