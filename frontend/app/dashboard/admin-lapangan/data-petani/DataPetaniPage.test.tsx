import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@user-event/setup";
import DataPetaniPage from "./page";
import api from "../../../lib/axios";
import Swal from "sweetalert2";

// 1. Mock Next/Navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// 2. Mock Axios API
jest.mock("../../../lib/axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
}));

// 3. Mock SweetAlert2 (Swal)
jest.mock("sweetalert2", () => {
  const fireMock = jest.fn();
  const mixinMock = jest.fn().mockReturnValue({ fire: fireMock });
  return {
    mixin: mixinMock,
    fire: fireMock,
  };
});

// 4. Mock Sub-komponen (FarmerList, FarmerForm, EmptyState)
jest.mock("@/app/components/dashboard/farmers/FarmerList", () => {
  return function MockFarmerList({ onSelectFarmer, onInitAdd, onSync }: any) {
    return (
      <div data-testid="farmer-list-component">
        <button onClick={onInitAdd}>Tambah Petani Baru</button>
        <button
          onClick={() =>
            onSelectFarmer({
              id: 1,
              nik: "1234567890123456",
              user: { name: "Budi Santoso", email: "budi@gmail.com", phone: "08123456789" },
              farmer_group_id: "10",
              province_id: "32",
              city_id: "32.04",
              district_id: "32.04.01",
              village_id: "32.04.01.001",
              lands: [{ id: 101, land_name: "Lahan 1", area: "1" }],
            })
          }
        >
          Pilih Budi Santoso
        </button>
        <button onClick={onSync}>Sync Data</button>
      </div>
    );
  };
});

jest.mock("@/app/components/dashboard/farmers/FarmerForm", () => {
  return function MockFarmerForm({
    onSubmit,
    onCancel,
    onDelete,
    onAddFarmerGroupClick,
    formData,
    setFormData,
  }: any) {
    return (
      <form data-testid="farmer-form-component" onSubmit={onSubmit}>
        <input
          data-testid="input-nik"
          value={formData.nik}
          onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
        />
        <input
          data-testid="input-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <button type="button" onClick={onAddFarmerGroupClick}>
          Buka Modal Kelompok Tani
        </button>
        <button type="submit">Simpan Form</button>
        <button type="button" onClick={onCancel}>
          Batal
        </button>
        <button type="button" onClick={onDelete}>
          Hapus Petani
        </button>
      </form>
    );
  };
});

jest.mock("@/app/components/dashboard/farmers/EmptyState", () => {
  return function MockEmptyState() {
    return <div data-testid="empty-state-component">Belum ada petani dipilih</div>;
  };
});

describe("DataPetaniPage Integration Tests", () => {
  const mockProvinces = [{ code: "32", name: "Jawa Barat" }];
  const mockFarmerGroups = [{ id: 10, name: "Kelompok Tani Tani Jaya" }];
  const mockFarmers = [
    {
      id: 1,
      nik: "1234567890123456",
      user: { name: "Budi Santoso", email: "budi@gmail.com" },
      city_id: "32.04",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock API implementations dasar
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "/farmers") return Promise.resolve({ data: { success: true, data: mockFarmers } });
      if (url === "/farmer-groups") return Promise.resolve({ data: { success: true, data: mockFarmerGroups } });
      if (url === "/regional/provinces") return Promise.resolve({ data: mockProvinces });
      if (url.includes("/cities")) return Promise.resolve({ data: [{ code: "32.04", name: "Bandung" }] });
      if (url.includes("/districts")) return Promise.resolve({ data: [{ code: "32.04.01", name: "Soreang" }] });
      if (url.includes("/villages")) return Promise.resolve({ data: [{ code: "32.04.01.001", name: "Sekarwangi" }] });
      return Promise.resolve({ data: [] });
    });
  });

  it("1. Harus melakukan fetch data awal (farmers, groups, provinces) saat halaman di-load", async () => {
    render(<DataPetaniPage />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/farmers");
      expect(api.get).toHaveBeenCalledWith("/farmer-groups");
      expect(api.get).toHaveBeenCalledWith("/regional/provinces");
    });

    expect(screen.getByTestId("empty-state-component")).toBeInTheDocument();
  });

  it("2. Menampilkan Form saat tombol 'Tambah Petani Baru' diklik", async () => {
    render(<DataPetaniPage />);

    fireEvent.click(screen.getByText("Tambah Petani Baru"));

    expect(screen.getByTestId("farmer-form-component")).toBeInTheDocument();
    expect(screen.queryByTestId("empty-state-component")).not.toBeInTheDocument();
  });

  it("3. Validasi Gagal saat menyimpan Form jika NIK bukan 16 digit", async () => {
    render(<DataPetaniPage />);

    // Buka form tambah
    fireEvent.click(screen.getByText("Tambah Petani Baru"));

    // Isi NIK tidak valid (misal: 123)
    const nikInput = screen.getByTestId("input-nik");
    fireEvent.change(nikInput, { target: { value: "123" } });

    // Submit Form
    fireEvent.click(screen.getByText("Simpan Form"));

    await waitFor(() => {
      // API post tidak boleh dipanggil jika NIK salah
      expect(api.post).not.toHaveBeenCalledWith("/farmers", expect.any(FormData), expect.any(Object));
    });
  });

  it("4. Berhasil mendaftarkan petani baru ketika NIK valid (16 digit)", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    render(<DataPetaniPage />);

    fireEvent.click(screen.getByText("Tambah Petani Baru"));

    // Isi NIK 16 digit & Nama
    fireEvent.change(screen.getByTestId("input-nik"), { target: { value: "1234567890123456" } });
    fireEvent.change(screen.getByTestId("input-name"), { target: { value: "Petani Baru" } });

    // Submit Form
    fireEvent.click(screen.getByText("Simpan Form"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/farmers",
        expect.any(FormData),
        expect.objectContaining({ headers: { "Content-Type": "multipart/form-data" } })
      );
    });
  });

  it("5. Berhasil membuka Modal Kelompok Tani dan menyimpan kelompok tani baru", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: { id: 99, name: "Kelompok Maju Bersama" } },
    });

    render(<DataPetaniPage />);

    // Buka form dulu
    fireEvent.click(screen.getByText("Tambah Petani Baru"));

    // Buka Modal Kelompok Tani
    fireEvent.click(screen.getByText("Buka Modal Kelompok Tani"));

    // Verifikasi Modal Tampil
    expect(screen.getByText("Kelompok Petani")).toBeInTheDocument();

    // Isi input nama kelompok tani
    const groupNameInput = screen.getByPlaceholderText("Masukkan nama kelompok tani...");
    fireEvent.change(groupNameInput, { target: { value: "Kelompok Maju Bersama" } });

    // Klik Simpan di Modal
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/farmer-groups", {
        name: "Kelompok Maju Bersama",
        description: "",
      });
    });
  });

  it("6. Berhasil memicu fungsi Hapus Petani dengan konfirmasi SweetAlert", async () => {
    // Mock SweetAlert agar langsung mengembalikan result.isConfirmed = true
    const SwalMock = require("sweetalert2");
    SwalMock.fire.mockResolvedValueOnce({ isConfirmed: true });
    (api.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    render(<DataPetaniPage />);

    // Pilih Petani Budi Santoso untuk mengaktifkan mode edit
    fireEvent.click(screen.getByText("Pilih Budi Santoso"));

    await waitFor(() => {
      expect(screen.getByTestId("farmer-form-component")).toBeInTheDocument();
    });

    // Klik Hapus
    fireEvent.click(screen.getByText("Hapus Petani"));

    await waitFor(() => {
      expect(SwalMock.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Apakah Anda yakin?",
        })
      );
      expect(api.delete).toHaveBeenCalledWith("/farmers/1");
    });
  });
});