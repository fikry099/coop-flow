import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page"; // Sesuaikan lokasi impor komponen LoginPage Anda
import api from "../../lib/axios";
import Swal from "sweetalert2";

// 1. Mock Next.js Router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// 2. Mock Axios
jest.mock("../../lib/axios", () => ({
  post: jest.fn(),
}));

// 3. Mock SweetAlert2 (agar fungsi Swal.mixin dan fire tidak memicu UI asli)
const mockFire = jest.fn();
jest.mock("sweetalert2", () => ({
  mixin: jest.fn(() => ({
    fire: mockFire,
  })),
  stopTimer: jest.fn(),
  resumeTimer: jest.fn(),
}));

describe("LoginPage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("1. Menampilkan peringatan Toast jika input disubmit dalam keadaan kosong", async () => {
    render(<LoginPage />);
    const user = userEvent.setup();

    // Klik tombol Sign In tanpa mengisi email/password
    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitButton);

    // Memastikan SweetAlert dipanggil dengan pesan peringatan
    expect(mockFire).toHaveBeenCalledWith({
      icon: "warning",
      title: "Email / NIK dan password wajib diisi.",
    });

    // Pastikan API login tidak dipanggil
    expect(api.post).not.toHaveBeenCalled();
  });

  it("2. Berhasil login sebagai Admin Lapangan dan mengarahkan ke dashboard admin-lapangan", async () => {
    // Mock respon sukses dari API
    const mockUserData = {
      access_token: "mock-token-123",
      user: {
        id: 1,
        name: "Admin Budi",
        roles: [{ name: "admin-lapangan" }],
      },
    };
    (api.post as jest.Mock).mockResolvedValueOnce({ data: mockUserData });

    render(<LoginPage />);
    const user = userEvent.setup();

    // Fill form input
    const identifierInput = screen.getByPlaceholderText(
      /masukkan email atau nik ktp anda/i
    );
    const passwordInput = screen.getByPlaceholderText(/masukkan password anda/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(identifierInput, "admin@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // Verify API called with correct payload
    expect(api.post).toHaveBeenCalledWith("/login", {
      login_identifier: "admin@example.com",
      email: "admin@example.com",
      password: "password123",
    });

    await waitFor(() => {
      // 1. Cek LocalStorage tersimpan
      expect(localStorage.getItem("access_token")).toBe("mock-token-123");
      expect(localStorage.getItem("user_profile")).toBe(
        JSON.stringify(mockUserData.user)
      );

      // 2. Cek SweetAlert sukses
      expect(mockFire).toHaveBeenCalledWith({
        icon: "success",
        title: "Login Berhasil! Selamat datang.",
      });

      // 3. Cek Redirect Router ke path role admin-lapangan
      expect(mockPush).toHaveBeenCalledWith("/dashboard/admin-lapangan");
    });
  });

  it("3. Menampilkan pesan error ketika API merespon gagal / unauthorized", async () => {
    // Mock respon error dari API
    (api.post as jest.Mock).mockRejectedValueOnce({
      response: {
        data: {
          message: "Email / NIK atau Password salah.",
        },
      },
    });

    render(<LoginPage />);
    const user = userEvent.setup();

    const identifierInput = screen.getByPlaceholderText(
      /masukkan email atau nik ktp anda/i
    );
    const passwordInput = screen.getByPlaceholderText(/masukkan password anda/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(identifierInput, "salah@example.com");
    await user.type(passwordInput, "passwordsalah");
    await user.click(submitButton);

    await waitFor(() => {
      // Cek SweetAlert error dipanggil dengan pesan dari backend
      expect(mockFire).toHaveBeenCalledWith({
        icon: "error",
        title: "Email / NIK atau Password salah.",
      });
    });
  });

  it("4. Mengarahkan pengguna ke halaman register saat tombol 'Daftar Akun Baru' diklik", async () => {
    render(<LoginPage />);
    const user = userEvent.setup();

    const registerButton = screen.getByRole("button", {
      name: /daftar akun baru/i,
    });
    await user.click(registerButton);

    expect(mockPush).toHaveBeenCalledWith("/auth/register");
  });
});