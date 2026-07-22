import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactionPanel, { SelectedFertilizerItem } from "./TransactionPanel";
import api from "@/app/lib/axios"; // Path disesuaikan ke @/lib/axios
import Swal from "sweetalert2";

// 1. Mock Axios menggunakan path yang benar (@/lib/axios)
jest.mock("@/app/lib/axios", () => ({
  post: jest.fn(),
}));

// 2. Mock SweetAlert2 Lengkap dengan DismissReason
jest.mock("sweetalert2", () => {
  const fireMock = jest.fn().mockResolvedValue({
    isConfirmed: true,
    dismiss: "cancel",
  });

  return {
    __esModule: true,
    default: {
      fire: fireMock,
      mixin: jest.fn(() => ({
        fire: fireMock,
      })),
      DismissReason: {
        cancel: "cancel",
        backdrop: "backdrop",
        close: "close",
        esc: "esc",
        timer: "timer",
      },
    },
    fire: fireMock,
    mixin: jest.fn(() => ({
      fire: fireMock,
    })),
    DismissReason: {
      cancel: "cancel",
      backdrop: "backdrop",
      close: "close",
      esc: "esc",
      timer: "timer",
    },
  };
});

// 3. Mock Sub-komponen SelectedItemsList agar fokus test pada TransactionPanel
jest.mock("./SelectedItemsList", () => {
  return function MockSelectedItemsList() {
    return <div data-testid="selected-items-list">Daftar Item Terpilih</div>;
  };
});

describe("TransactionPanel Component", () => {
  const mockItems: SelectedFertilizerItem[] = [
    {
      bagKey: "bag-1",
      fertilizer_id: 10,
      fertilizer_code: "UREA",
      nama: "Pupuk Urea",
      weightKg: 50,
      price_per_kg: 2000,
      subtotal: 100000,
      isChecked: true,
      image_url: null,
      original_recommended_kg: 50,
      land_id: 1,
      analysis_meta_snapshot: {
        luas_lahan_hektar: 1,
        jenis_komoditas: "Padi",
        fase_tanam_saat_ini: "Vegetatif",
        suhu_rata_rata_celcius: 28,
        kelembapan_persen: 80,
        curah_hujan_mm: 150,
      },
    },
  ];

  const defaultProps = {
    farmerId: 5,
    grandTotalCost: 100000,
    items: mockItems,
    onBack: jest.fn(),
    onSuccess: jest.fn(),
    farmerName: "Pak Paksi",
    farmerAddress: "Jl. Tani Mulya",
    villageName: "Desa Makmur",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Meredam log console agar output terminal test tetap rapi & tidak bising
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("1. Menghitung kalkulasi kembalian tunai secara otomatis", async () => {
    render(<TransactionPanel {...defaultProps} />);
    const user = userEvent.setup();

    // Input nominal dibayar = 150.000 (Total harga = 100.000)
    const amountPaidInput = screen.getByPlaceholderText("0");
    await user.type(amountPaidInput, "150000");

    // Kembalian harus 50.000
    expect(screen.getAllByText("Rp 50.000").length).toBeGreaterThan(0);
  });

  it("2. Mencegah transaksi tunai jika nominal dibayar kurang dari total harga", async () => {
    render(<TransactionPanel {...defaultProps} />);
    const user = userEvent.setup();

    // Input nominal dibayar = 50.000 (Kurang)
    const amountPaidInput = screen.getByPlaceholderText("0");
    await user.type(amountPaidInput, "50000");

    // Klik tombol Konfirmasi Pembayaran
    const payButton = screen.getByRole("button", { name: /konfirmasi pembayaran/i });
    await user.click(payButton);

    // Harus muncul pesan error di UI dan API TIDAK dipanggil
    expect(
      screen.getByText("Nominal pembayaran tunai kurang dari total harga!")
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("3. Mencegah transaksi jika terdeteksi ID pupuk tidak valid (cacat/0)", () => {
    const invalidItems: SelectedFertilizerItem[] = [
      {
        ...mockItems[0],
        fertilizer_id: 0, // ID CACAT
      },
    ];

    render(<TransactionPanel {...defaultProps} items={invalidItems} />);

    // Harus muncul peringatan ID Pupuk Cacat
    expect(
      screen.getByText(/terdeteksi pupuk tanpa id database yang valid/i)
    ).toBeInTheDocument();

    // Tombol konfirmasi harus berubah menjadi tombol peringatan cacat
    const disabledButton = screen.getByRole("button", { name: /id pupuk cacat/i });
    expect(disabledButton).toBeDisabled();
  });

  it("4. Berhasil mengirim transaksi tunai ke backend jika input valid", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: {
        success: true,
        data: { transaction_code: "GAF-123-4567" },
      },
    });

    render(<TransactionPanel {...defaultProps} />);
    const user = userEvent.setup();

    // Isi nominal pas 100.000
    const amountPaidInput = screen.getByPlaceholderText("0");
    await user.type(amountPaidInput, "100000");

    const payButton = screen.getByRole("button", { name: /konfirmasi pembayaran/i });
    await user.click(payButton);

    // Cek API post dipanggil ke URL transaksi
    expect(api.post).toHaveBeenCalledWith(
      "/cooperative/transaction/transactionsfix",
      expect.objectContaining({
        farmer_id: 5,
        payment_method: "Tunai",
        amount_paid: 100000,
      })
    );

    // Cek SweetAlert dipanggil untuk popup struk
    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalled();
    });
  });
});