import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AiProcurementPanel from "./AiProcurementPanel";
import Swal from "sweetalert2";

// 1. Mock SweetAlert2
jest.mock("sweetalert2", () => ({
  mixin: jest.fn().mockReturnValue({
    fire: jest.fn(),
  }),
  stopTimer: jest.fn(),
  resumeTimer: jest.fn(),
}));

// 2. Mock Sub-komponen ProcurementModal
jest.mock("./ProcurementModal", () => {
  return function MockProcurementModal({
    isOpen,
    onClose,
    onSuccessSubmit,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccessSubmit: (data: any) => void;
  }) {
    if (!isOpen) return null;
    return (
      <div data-testid="procurement-modal">
        <p>Mock Procurement Modal</p>
        <button onClick={onClose}>Tutup Modal</button>
        <button
          onClick={() =>
            onSuccessSubmit({ po_number: "PO-TEST-2026-99" })
          }
        >
          Submit PO Mock
        </button>
      </div>
    );
  };
});

describe("AiProcurementPanel Component", () => {
  const mockAiData = {
    overview: {
      periode_pengadaan: "Agustus 2026",
      total_pengadaan_kg: 5000,
      total_pengadaan_bags: 100,
      jenis_pupuk_count: 2,
    },
    items: [
      {
        id: "1",
        fertilizer_id: 10,
        name: "Pupuk Urea NPK",
        current_stock_kg: 500,
        suggested_procurement_kg: 3000,
        suggested_procurement_bags: 60,
        packaging_size_kg: 50,
        price_per_kg: 3000,
        harga_per_karung: 150000,
        image_url: null,
        analysis_meta: {
          wilayah: "Sleman, DI Yogyakarta",
          jarak_ke_pusat: "15 km",
          lead_time_sistem: "3 Hari",
          estimasi_sampai: "05 Agustus 2026",
          bulan_analisis: "Agustus",
          keterangan_sistem: "Dihitung otomatis berdasarkan histori",
          stok_saat_ini: "500 Kg",
          prediksi_sebulan: "3500 Kg",
        },
      },
      {
        id: "2",
        fertilizer_id: 11,
        name: "Pupuk Organik Super",
        current_stock_kg: 2000,
        suggested_procurement_kg: 0,
        suggested_procurement_bags: 0,
        packaging_size_kg: 50,
        price_per_kg: 2000,
        harga_per_karung: 100000,
        image_url: null,
        analysis_meta: {
          keterangan_sistem: "Stok Masih Cukup (Aman)",
        },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("1. Mengembalikan null (tidak merender apa pun) jika aiData.overview kosong/undefined", () => {
    const { container } = render(
      <AiProcurementPanel aiData={{ overview: null as any, items: [] }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("2. Menampilkan data ringkasan AI, metrik logistik, dan tabel item dengan benar", () => {
    render(<AiProcurementPanel aiData={mockAiData} />);

    // Cek Ringkasan Header & Metrik
    expect(screen.getByText("Agustus 2026")).toBeInTheDocument();
    expect(screen.getByText("5.000 Kg")).toBeInTheDocument();
    expect(screen.getByText("100 Karung")).toBeInTheDocument();
    expect(screen.getByText("Sleman, DI Yogyakarta")).toBeInTheDocument();

    // Cek Lead Time & Estimasi
    expect(screen.getByText("3 Hari")).toBeInTheDocument();
    expect(screen.getByText("05 Agustus 2026")).toBeInTheDocument();

    // Cek Item dalam Tabel
    expect(screen.getByText("Pupuk Urea NPK")).toBeInTheDocument();
    expect(screen.getByText("3.000 Kg")).toBeInTheDocument();
    expect(screen.getByText("Pupuk Organik Super")).toBeInTheDocument();
    expect(screen.getByText("Stok Masih Cukup (Aman)")).toBeInTheDocument();
  });

  it("3. Membuka dan menutup Modal Pengadaan PO Massal saat tombol diklik", async () => {
    render(<AiProcurementPanel aiData={mockAiData} />);
    const user = userEvent.setup();

    // Modal seharusnya belum tampil
    expect(screen.queryByTestId("procurement-modal")).not.toBeInTheDocument();

    // Klik tombol 'Proses PO Massal'
    const openModalBtn = screen.getByRole("button", {
      name: /proses po massal/i,
    });
    await user.click(openModalBtn);

    // Modal harus terbuka
    expect(screen.getByTestId("procurement-modal")).toBeInTheDocument();

    // Klik tombol Tutup Modal
    const closeModalBtn = screen.getByRole("button", { name: /tutup modal/i });
    await user.click(closeModalBtn);

    // Modal harus tertutup kembali
    expect(screen.queryByTestId("procurement-modal")).not.toBeInTheDocument();
  });

  it("4. Menampilkan SweetAlert Toast sukses setelah pengajuan PO berhasil dari modal", async () => {
    render(<AiProcurementPanel aiData={mockAiData} />);
    const user = userEvent.setup();

    // Buka Modal
    await user.click(screen.getByRole("button", { name: /proses po massal/i }));

    // Simulasi Submit Sukses dari Sub-Komponen Modal
    await user.click(
      screen.getByRole("button", { name: /submit po mock/i })
    );

    // Modal tertutup setelah sukses
    expect(screen.queryByTestId("procurement-modal")).not.toBeInTheDocument();

    // Memastikan SweetAlert Toast dipanggil
    const toastInstance = Swal.mixin({});
    await waitFor(() => {
      expect(toastInstance.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: "success",
          title: "Berhasil!",
          text: expect.stringContaining("PO-TEST-2026-99"),
        })
      );
    });
  });
});