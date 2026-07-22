import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ValidationForm from "./ValidationForm";

describe("ValidationForm Component", () => {
  // Mock Data untuk Props
  const mockFarmer = {
    nik: "3201123456780001",
    name: "Petani Supardi",
    farmer_group: {
      id: 1,
      name: "Kelompok Tani Makmur",
    },
    lands: [{ id: 101 }, { id: 102 }],
    village: {
      name: "Desa Sukamaju",
    },
  };

  const mockLand = {
    id: 101,
    land_name: "Lahan Sawit Blok A",
    area: "2.5",
    status: "Aktif",
    location_address: "Jl. Tani No. 5",
    unit: "Hektar(Ha)",
    ownership_document: "/documents/sertifikat.pdf",
  };

  const defaultProps = {
    selectedFarmer: mockFarmer,
    selectedLand: mockLand,
    areaHectares: "2.5",
    setAreaHectares: jest.fn(),
    plantingDate: "2026-07-05",
    setPlantingDate: jest.fn(),
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    mapWorkspaceComponent: <div data-testid="map-workspace">Map Workspace Mock</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("1. Menampilkan ringkasan data petani dan lahan dengan benar pada header/metrics", () => {
    render(<ValidationForm {...defaultProps} />);

    // Cek Nama Petani & NIK
    expect(screen.getByText("Petani Supardi")).toBeInTheDocument();
    expect(screen.getByText("NIK: 3201123456780001")).toBeInTheDocument();
    expect(screen.getByText("Kelompok: Kelompok Tani Makmur")).toBeInTheDocument();

    // Cek Metrics Mini Grid (Luas Lahan, Status, Jumlah Lahan)
    expect(screen.getByText("2.5 Ha")).toBeInTheDocument();
    expect(screen.getByText("Aktif")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // totalLandsCount = 2

    // Cek Map Workspace komponen anak ter-render
    expect(screen.getByTestId("map-workspace")).toBeInTheDocument();
  });

  it("2. Menampilkan dan menyembunyikan detail lahan saat tombol toggle diklik", async () => {
    render(<ValidationForm {...defaultProps} />);
    const user = userEvent.setup();

    // Awalnya form detail TIDAK tampil di layar
    expect(screen.queryByText(/Informasi Spasial Objek/i)).not.toBeInTheDocument();

    // Klik tombol 'Lihat Detail Data Lahan'
    const showDetailBtn = screen.getByRole("button", { name: /lihat detail data lahan/i });
    await user.click(showDetailBtn);

    // Sekarang detail lahan HARUS tampil di layar
    expect(screen.getByText(/Informasi Spasial Objek \(Lahan Sawit Blok A\)/i)).toBeInTheDocument();

    // Klik tombol 'Sembunyikan Detail Lahan'
    const hideDetailBtn = screen.getByRole("button", { name: /sembunyikan detail lahan/i });
    await user.click(hideDetailBtn);

    // Detail lahan HARUS hilang kembali dari layar
    expect(screen.queryByText(/Informasi Spasial Objek/i)).not.toBeInTheDocument();
  });

  it("3. Memanggil fungsi setAreaHectares saat user mengubah nilai Luas Validasi", async () => {
    render(<ValidationForm {...defaultProps} />);
    const user = userEvent.setup();

    // Buka detail dulu agar input Luas Validasi terlihat
    const showDetailBtn = screen.getByRole("button", { name: /lihat detail data lahan/i });
    await user.click(showDetailBtn);

    // Cari input Luas Validasi Ground Check berdasarkan nilainya
    const areaInput = screen.getByDisplayValue("2.5");
    
    // Menggunakan fireEvent.change untuk mentrigger onChange secara tegas & handal
    fireEvent.change(areaInput, { target: { value: "3.0" } });

    // Memastikan callback setAreaHectares dipanggil
    expect(defaultProps.setAreaHectares).toHaveBeenCalled();
  });

  it("4. Menampilkan tombol unduh dokumen jika lampiran sertifikat berbentuk PDF", async () => {
    render(<ValidationForm {...defaultProps} />);
    const user = userEvent.setup();

    // Buka detail
    const showDetailBtn = screen.getByRole("button", { name: /lihat detail data lahan/i });
    await user.click(showDetailBtn);

    // Cek tautan unduh berkas
    const downloadLink = screen.getByRole("link", { name: /unduh \/ buka dokumen/i });
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink).toHaveAttribute("href", "http://localhost:8000/documents/sertifikat.pdf");
  });
});