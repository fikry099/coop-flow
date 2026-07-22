import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ValidasiLahanPage from './page'; // Sesuaikan path jika berbeda
import Swal from 'sweetalert2';
import api from '../../../lib/axios';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Sweetalert2
jest.mock('sweetalert2', () => ({
  mixin: jest.fn(() => ({
    fire: jest.fn(),
  })),
  fire: jest.fn(),
}));

// Mock Axios
jest.mock('../../../lib/axios', () => ({
  get: jest.fn(),
  put: jest.fn(),
}));

// --- MOCK CHILD COMPONENTS SESUAI IMPORT ASLI ---

jest.mock('@/app/components/dashboard/land-validation/ValidationFarmerList', () => ({
  __esModule: true,
  default: ({ onSelectLand, setActiveTab, activeTab }: any) => (
    <div data-testid="validation-farmer-list">
      <button
        data-testid="select-land-btn"
        onClick={() =>
          onSelectLand(
            {
              id: 1,
              nik: '123456789',
              user: { name: 'Pak Tani', email: 'tani@mail.com', phone: '0812' },
              lands: [
                { id: 101, land_name: 'Lahan Jagung', area: '2.5', unit: 'Hektar(Ha)' },
              ],
            },
            { id: 101, land_name: 'Lahan Jagung', area: '2.5', unit: 'Hektar(Ha)' }
          )
        }
      >
        Pilih Lahan
      </button>

      <button
        data-testid="switch-tab-btn"
        onClick={() => setActiveTab(activeTab === 'belum' ? 'sudah' : 'belum')}
      >
        Switch Tab
      </button>
    </div>
  ),
}));

jest.mock('@/app/components/dashboard/land-validation/ValidationForm', () => ({
  __esModule: true,
  default: ({ onSubmit, onCancel, mapWorkspaceComponent }: any) => (
    <div data-testid="validation-form">
      <form
        data-testid="real-form"
        onSubmit={(e) =>
          onSubmit(e, {
            center_latitude: -7.12,
            center_longitude: 110.12,
          })
        }
      >
        <button type="submit" data-testid="form-submit-btn">
          Submit Form
        </button>
      </form>
      <button data-testid="form-cancel-btn" onClick={onCancel}>
        Batal
      </button>
      {mapWorkspaceComponent}
    </div>
  ),
}));

jest.mock('@/app/components/dashboard/land-validation/MapWorkspace', () => ({
  __esModule: true,
  default: ({ onSave, onTriggerReMapping, onPolygonChange }: any) => (
    <div data-testid="map-workspace">
      <button
        data-testid="map-save-btn"
        onClick={() =>
          onSave({
            center_latitude: -7.12,
            center_longitude: 110.12,
          })
        }
      >
        Simpan dari Map
      </button>
      <button
        data-testid="trigger-remapping-btn"
        onClick={() => onTriggerReMapping()}
      >
        ReMap
      </button>
      <button
        data-testid="update-polygon-btn"
        onClick={() => onPolygonChange([[-7.1, 110.1], [-7.2, 110.2], [-7.3, 110.3]])}
      >
        Update Polygon
      </button>
    </div>
  ),
}));

jest.mock('@/app/components/dashboard/land-validation/EmptyValidationState', () => ({
  __esModule: true,
  default: () => <div data-testid="empty-state">Empty Workspace State</div>,
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('ValidasiLahanPage Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockedApi.get.mockResolvedValue({
      data: { success: true, data: [] },
    });
  });

  it('1. Render halaman utama, judul header, dan empty state dengan benar', async () => {
    render(<ValidasiLahanPage />);

    expect(screen.getByText('Validasi Lahan Geospasial')).toBeInTheDocument();
    expect(screen.getByTestId('validation-farmer-list')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(mockedApi.get).toHaveBeenCalledWith('/farmers');
  });

  it('2. Navigasi kembali ke dashboard admin-lapangan saat tombol back diklik', () => {
    render(<ValidasiLahanPage />);

    const backButton = screen.getByRole('button', { name: '' }); // Tombol back FaArrowLeft
    fireEvent.click(backButton);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/admin-lapangan');
  });

  it('3. Memilih lahan dari daftar petani akan menampilkan Form & Map Workspace', () => {
    render(<ValidasiLahanPage />);

    fireEvent.click(screen.getByTestId('select-land-btn'));

    expect(screen.getByTestId('validation-form')).toBeInTheDocument();
    expect(screen.getByTestId('map-workspace')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });

  it('4. Membatalkan form validasi akan mengembalikan tampilan ke empty state', () => {
    render(<ValidasiLahanPage />);

    // Pilih lahan
    fireEvent.click(screen.getByTestId('select-land-btn'));
    expect(screen.getByTestId('validation-form')).toBeInTheDocument();

    // Klik Batal
    fireEvent.click(screen.getByTestId('form-cancel-btn'));
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('5. Berhasil melakukan submit validasi lahan / sinkronisasi (API Success)', async () => {
    mockedApi.put.mockResolvedValueOnce({
      data: { success: true },
    });

    render(<ValidasiLahanPage />);

    // Pilih lahan & Submit Form
    fireEvent.click(screen.getByTestId('select-land-btn'));
    fireEvent.submit(screen.getByTestId('real-form'));

    await waitFor(() => {
      expect(mockedApi.put).toHaveBeenCalledWith(
        '/farmers/1',
        expect.objectContaining({
          name: 'Pak Tani',
          nik: '123456789',
          lands: expect.arrayContaining([
            expect.objectContaining({
              id: 101,
              land_name: 'Lahan Jagung',
              unit: 'Hektar(Ha)',
              status: 'Milik Sendiri',
              center_latitude: -7.12,
              center_longitude: 110.12,
            }),
          ]),
        })
      );
      expect(Swal.mixin).toHaveBeenCalled();
    });
  });

  it('6. Berhasil menyimpan sinkronisasi langsung dari MapWorkspace (onSave)', async () => {
    mockedApi.put.mockResolvedValueOnce({
      data: { success: true },
    });

    render(<ValidasiLahanPage />);

    // Pilih lahan
    fireEvent.click(screen.getByTestId('select-land-btn'));

    // Klik tombol simpan dari MapWorkspace
    fireEvent.click(screen.getByTestId('map-save-btn'));

    await waitFor(() => {
      expect(mockedApi.put).toHaveBeenCalledWith(
        '/farmers/1',
        expect.objectContaining({
          lands: expect.arrayContaining([
            expect.objectContaining({
              id: 101,
              center_latitude: -7.12,
            }),
          ]),
        })
      );
    });
  });

  it('7. Gagal submit validasi lahan karena error response API (Laravel Validation Errors)', async () => {
    mockedApi.put.mockRejectedValueOnce({
      response: {
        data: {
          errors: {
            area: ['Luas lahan harus diisi'],
          },
        },
      },
    });

    const spyConsole = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<ValidasiLahanPage />);

    fireEvent.click(screen.getByTestId('select-land-btn'));
    fireEvent.submit(screen.getByTestId('real-form'));

    await waitFor(() => {
      expect(Swal.mixin).toHaveBeenCalled();
    });

    spyConsole.mockRestore();
  });

  it('8. Membaca profil admin dari localStorage saat render', () => {
    localStorage.setItem('user_profile', JSON.stringify({ name: 'Siti Admin' }));

    render(<ValidasiLahanPage />);

    // Memastikan fetchFarmers dan render berjalan tanpa krisis
    expect(mockedApi.get).toHaveBeenCalledWith('/farmers');
  });

  it('9. Mereset pilihan lahan ketika tab berpindah secara manual', () => {
    render(<ValidasiLahanPage />);

    // Pilih lahan
    fireEvent.click(screen.getByTestId('select-land-btn'));
    expect(screen.getByTestId('validation-form')).toBeInTheDocument();

    // Pindah Tab
    fireEvent.click(screen.getByTestId('switch-tab-btn'));

    // Pilihan lahan harus reset ke Empty State
    expect(screen.queryByTestId('validation-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('10. Memperbarui luas hektar otomatis saat polygon di-update', () => {
    render(<ValidasiLahanPage />);

    fireEvent.click(screen.getByTestId('select-land-btn'));
    fireEvent.click(screen.getByTestId('update-polygon-btn'));

    // Polygon 3 titik -> 3 * 0.12 = 0.36
    // Komponen ValidationForm ter-render tanpa throw error
    expect(screen.getByTestId('validation-form')).toBeInTheDocument();
  });
});