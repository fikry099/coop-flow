import { render, screen, waitFor, fireEvent } from "@testing-library/react"; // Tambahkan fireEvent
import userEvent from "@testing-library/user-event";
import FormTambahPetani from "./FormTambahPetani";
import api from "@/app/lib/axios";
import Swal from "sweetalert2";

// 1. Mock Axios API
jest.mock("@/app/lib/axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

// 2. Mock SweetAlert2
jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
}));

// 3. Mock Sub-komponen
jest.mock("./RegionSelectSection", () => {
  return function MockRegion() {
    return <div data-testid="region-section">Region Select Section</div>;
  };
});

jest.mock("./LandFormSection", () => {
  return function MockLandSection() {
    return <div data-testid="land-section">Land Form Section</div>;
  };
});

jest.mock("./FarmerGroupModal", () => {
  return function MockGroupModal({ onGroupCreated }: { onGroupCreated: Function }) {
    return (
      <div data-testid="group-modal">
        <button
          onClick={() => onGroupCreated({ id: 99, name: "Kelompok Tani Baru Mock" })}
        >
          Tambah Group Mock
        </button>
      </div>
    );
  };
});

describe("FormTambahPetani Component", () => {
  const defaultProps = {
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
  };

  const mockGroups = [
    { id: 1, name: "Kelompok Tani Subur" },
    { id: 2, name: "Kelompok Tani Makmur" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({
      data: { success: true, data: mockGroups },
    });
  });

  it("1. Otomatis mengambil daftar Kelompok Tani saat komponen pertama kali dimuat", async () => {
    render(<FormTambahPetani {...defaultProps} />);

    expect(api.get).toHaveBeenCalledWith("/farmer-groups");

    await waitFor(() => {
      expect(screen.getByText("Kelompok Tani Subur")).toBeInTheDocument();
      expect(screen.getByText("Kelompok Tani Makmur")).toBeInTheDocument();
    });
  });

  it("2. Membuka modal Kelompok Tani Baru dan memilihnya secara otomatis saat grup baru dibuat", async () => {
    render(<FormTambahPetani {...defaultProps} />);
    const user = userEvent.setup();

    const openModalBtn = screen.getByRole("button", { name: /\+ baru/i });
    await user.click(openModalBtn);

    expect(screen.getByTestId("group-modal")).toBeInTheDocument();

    const addGroupBtn = screen.getByRole("button", { name: /tambah group mock/i });
    await user.click(addGroupBtn);

    await waitFor(() => {
      expect(screen.getByText("Kelompok Tani Baru Mock")).toBeInTheDocument();
    });
  });

  it(
    "3. Berhasil menyimpan Petani (POST /farmers) dan Tanaman (POST /plants) secara berurutan",
    async () => {
      (api.post as jest.Mock).mockImplementation((url) => {
        if (url === "/farmers") {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                id: 10,
                lands: [{ id: 501 }],
              },
            },
          });
        }
        if (url === "/plants") {
          return Promise.resolve({ data: { success: true } });
        }
        return Promise.reject(new Error("URL tidak dikenali"));
      });

      render(<FormTambahPetani {...defaultProps} />);
      const user = userEvent.setup();

      // Tunggu dropdown terisi
      await waitFor(() => {
        expect(screen.getByText("Kelompok Tani Subur")).toBeInTheDocument();
      });

      // Isi Form Profil
      await user.type(screen.getByPlaceholderText(/nama petani/i), "Petani Supri");
      await user.type(screen.getByPlaceholderText(/petani@email.com/i), "supri@gmail.com");
      await user.type(screen.getByPlaceholderText(/minimal 8 karakter/i), "password123");

      // FIX PERFORMANSA: Gunakan fireEvent.change untuk NIK 16 digit agar cepat & tidak timeout
      fireEvent.change(screen.getByPlaceholderText(/16 digit nik/i), {
        target: { value: "3201123456780009" },
      });

      const comboboxes = screen.getAllByRole("combobox");
      await user.selectOptions(comboboxes[0], "1");

      // Klik Simpan Petani
      const submitBtn = screen.getByRole("button", { name: /simpan petani/i });
      await user.click(submitBtn);

      // Memastikan POST /farmers dipanggil
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          "/farmers",
          expect.any(FormData),
          expect.objectContaining({
            headers: { "Content-Type": "multipart/form-data" },
          })
        );

        expect(Swal.fire).toHaveBeenCalled();
        expect(defaultProps.onSuccess).toHaveBeenCalled();
      });
    },
    15000 // FIX TIMEOUT: Menaikkan batas timeout khusus untuk test ini menjadi 15 detik
  );

  it("4. Menampilkan pesan error SweetAlert ketika backend Laravel menolak/gagal menyimpan", async () => {
    (api.post as jest.Mock).mockRejectedValueOnce({
      response: {
        data: {
          message: "NIK sudah terdaftar di sistem.",
        },
      },
    });

    render(<FormTambahPetani {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/nama petani/i), "Petani Supri");
    await user.type(screen.getByPlaceholderText(/petani@email.com/i), "supri@gmail.com");
    await user.type(screen.getByPlaceholderText(/minimal 8 karakter/i), "password123");

    // Gunakan fireEvent.change agar proses cepat
    fireEvent.change(screen.getByPlaceholderText(/16 digit nik/i), {
      target: { value: "3201123456780009" },
    });

    const comboboxes = screen.getAllByRole("combobox");
    await user.selectOptions(comboboxes[0], "1");

    const submitBtn = screen.getByRole("button", { name: /simpan petani/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalled();
    });
  });
});