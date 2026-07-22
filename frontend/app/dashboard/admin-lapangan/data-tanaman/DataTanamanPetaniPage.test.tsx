import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DataTanamanPetaniPage from "./page";
import api from "../../../lib/axios";
import { Toast, confirmDialog } from "@/app/lib/toast";

// 0. Mock Next.js App Router (Penyebab utama error 'app router to be mounted')
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      prefetch: () => null,
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    };
  },
  usePathname() {
    return "";
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// 1. Mock Axios API
jest.mock("../../../lib/axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// 2. Mock Toast & Confirm Dialog Utils
jest.mock("@/app/lib/toast", () => ({
  Toast: {
    fire: jest.fn(),
  },
  confirmDialog: jest.fn(),
}));

// 3. Mock Sub-komponen (PlantDetailSkeleton, FarmerListPanel, FarmerPlantDetail)
jest.mock("../../../components/dashboard/data-tanaman/PlantDetailSkeleton", () => {
  return function MockSkeleton() {
    return <div data-testid="plant-skeleton">Memuat Skeleton...</div>;
  };
});

jest.mock("../../../components/dashboard/data-tanaman/FarmerListPanel", () => {
  return function MockFarmerListPanel({ farmers, onSelectFarmer }: any) {
    return (
      <div data-testid="farmer-list-panel">
        Total Petani: {farmers.length}
        {farmers.map((f: any) => (
          <button key={f.id} onClick={() => onSelectFarmer(f)}>
            Pilih {f.user?.name || f.name}
          </button>
        ))}
      </div>
    );
  };
});

jest.mock("../../../components/dashboard/data-tanaman/FarmerPlantDetail", () => {
  return function MockFarmerPlantDetail({
    selectedFarmer,
    onSavePlant,
    onUpdatePlant,
    onDeletePlant,
    onDeleteAllPlantsInLand,
  }: any) {
    if (!selectedFarmer) {
      return <div data-testid="farmer-detail-empty">Pilih petani untuk melihat detail.</div>;
    }

    return (
      <div data-testid="farmer-plant-detail">
        Detail Petani: {selectedFarmer.user?.name || selectedFarmer.name}
        <button
          onClick={() =>
            onSavePlant({
              land_id: 101,
              plants: [{ name: "Padi IR64", planting_date: "2026-03-01" }],
            })
          }
        >
          Tambah Tanaman Mock
        </button>
        <button
          onClick={() =>
            onUpdatePlant(501, {
              name: "Jagung Hibrida",
              planting_date: "2026-04-01",
              land_id: 101,
            })
          }
        >
          Edit Tanaman Mock
        </button>
        <button onClick={() => onDeletePlant(501)}>Hapus Tanaman Mock</button>
        <button onClick={() => onDeleteAllPlantsInLand(101, [501, 502])}>
          Kosongkan Lahan Mock
        </button>
      </div>
    );
  };
});

describe("DataTanamanPetaniPage Component (Page Integration Test)", () => {
  const mockFarmers = [
    {
      id: 1,
      name: "Pak Budi",
      user: { name: "Pak Budi", email: "budi@gmail.com" },
      lands: [
        {
          id: 101,
          land_name: "Sawah Barat",
          plants: [
            { id: 501, name: "Padi Ciherang", planting_date: "2026-01-10" },
            { id: 502, name: "Jagung Manis", planting_date: "2026-02-01" },
          ],
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({
      data: { success: true, data: mockFarmers },
    });
  });

  it("1. Menampilkan Skeleton Loading saat pertama kali dimuat dan menggantinya dengan data utama", async () => {
    render(<DataTanamanPetaniPage />);

    // Memastikan Skeleton Tampil di awal
    expect(screen.getByTestId("plant-skeleton")).toBeInTheDocument();

    // Tunggu hingga API /farmers selesai
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/farmers");
      expect(screen.queryByTestId("plant-skeleton")).not.toBeInTheDocument();
      expect(screen.getByTestId("farmer-list-panel")).toHaveTextContent("Total Petani: 1");
    });
  });

  it("2. Berhasil memilih petani dan menampilkan komponen FarmerPlantDetail", async () => {
    render(<DataTanamanPetaniPage />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByTestId("farmer-list-panel")).toBeInTheDocument();
    });

    // Klik tombol pilih petani
    await user.click(screen.getByRole("button", { name: /pilih pak budi/i }));

    // Detail petani harus aktif
    expect(screen.getByTestId("farmer-plant-detail")).toHaveTextContent("Detail Petani: Pak Budi");
  });

  it("3. Berhasil menambah tanaman baru (POST /plants) dan memicu Toast Sukses", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: {
        success: true,
        data: [{ id: 503, name: "Padi IR64", planting_date: "2026-03-01" }],
      },
    });

    render(<DataTanamanPetaniPage />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByTestId("farmer-list-panel")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /pilih pak budi/i }));
    await user.click(screen.getByRole("button", { name: /tambah tanaman mock/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/plants",
        expect.objectContaining({
          land_id: 101,
        })
      );
      expect(Toast.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: "success",
          title: "Varietas berhasil disimpan!",
        })
      );
    });
  });

  it("4. Berhasil memperbarui data tanaman (PUT /plants/{id})", async () => {
    (api.put as jest.Mock).mockResolvedValueOnce({
      data: {
        success: true,
        data: { id: 501, name: "Jagung Hibrida", planting_date: "2026-04-01" },
      },
    });

    render(<DataTanamanPetaniPage />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByTestId("farmer-list-panel")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /pilih pak budi/i }));
    await user.click(screen.getByRole("button", { name: /edit tanaman mock/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        "/plants/501",
        expect.objectContaining({
          name: "Jagung Hibrida",
        })
      );
      expect(Toast.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: "success",
          title: "Data berhasil diperbarui!",
        })
      );
    });
  });

  it("5. Menghapus tanaman tunggal (DELETE /plants/{id}) setelah mengonfirmasi dialog", async () => {
    // Mock konfirmasi dialog disetujui
    (confirmDialog as jest.Mock).mockResolvedValueOnce({ isConfirmed: true });
    (api.delete as jest.Mock).mockResolvedValueOnce({
      data: { success: true },
    });

    render(<DataTanamanPetaniPage />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByTestId("farmer-list-panel")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /pilih pak budi/i }));
    await user.click(screen.getByRole("button", { name: /hapus tanaman mock/i }));

    await waitFor(() => {
      expect(confirmDialog).toHaveBeenCalled();
      expect(api.delete).toHaveBeenCalledWith("/plants/501");
      expect(Toast.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: "success",
          title: "Varietas berhasil dihapus.",
        })
      );
    });
  });
});