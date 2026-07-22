import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StokSaatIniPage from './page'; 
import api from '../../../lib/axios';

// Mock Axios
jest.mock('../../../lib/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock Child Components
jest.mock(
  '@/app/components/dashboard/admin-koperasi/inventory/InventorySummary',
  () => ({
    __esModule: true,
    default: ({ summary }: any) => (
      <div data-testid="inventory-summary">
        Summary Total: {summary ? summary.total_items : 'No Data'}
      </div>
    ),
  })
);

jest.mock(
  '@/app/components/dashboard/admin-koperasi/inventory/StockTable',
  () => ({
    __esModule: true,
    default: ({ stocks, refreshData }: any) => (
      <div data-testid="stock-table">
        <span data-testid="stock-count">{stocks.length} Items</span>
        <button data-testid="refresh-btn" onClick={refreshData}>
          Refresh Table
        </button>
        <ul>
          {stocks.map((item: any) => (
            <li key={item.id} data-testid="stock-item">
              {item.name} - Rp{item.price_per_kg} - Stok: {item.current_stock_kg}kg
            </li>
          ))}
        </ul>
      </div>
    ),
  })
);

jest.mock(
  '@/app/components/dashboard/admin-koperasi/inventory/AiProcurementPanel',
  () => ({
    __esModule: true,
    default: ({ aiData }: any) => (
      <div data-testid="ai-panel">
        AI Recommendation: {aiData ? aiData.recommendation : 'No AI Data'}
      </div>
    ),
  })
);

const mockedApi = api as jest.Mocked<typeof api>;

describe('StokSaatIniPage Unit Tests', () => {
  const mockOverviewData = {
    success: true,
    data: { total_items: 10, total_value: 5000000 },
  };

  const mockFertilizersData = {
    success: true,
    data: [
      { id: 1, name: 'Pupuk Urea', current_stock_kg: 500, price_per_kg: 10000 },
      { id: 2, name: 'Pupuk NPK', current_stock_kg: 150, price_per_kg: 15000 },
      { id: 3, name: 'Pupuk ZA', current_stock_kg: 0, price_per_kg: 8000 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    document.cookie = 'access_token=mock_token_123; path=/';

    // Mock scrollIntoView untuk Jest/JSDOM
    window.HTMLElement.prototype.scrollIntoView = jest.fn();

    // Default API mock implementations
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/cooperative/inventory/overview') {
        return Promise.resolve({ data: mockOverviewData });
      }
      if (url === '/cooperative/fertilizers') {
        return Promise.resolve({ data: mockFertilizersData });
      }
      return Promise.reject(new Error('Endpoint not found'));
    });
  });

  it('1. Menampilkan skeleton loading saat data sedang dimuat pertama kali', () => {
    // Gunakan mockImplementationOnce agar tidak merusak test lain
    mockedApi.get.mockImplementationOnce(() => new Promise(() => {}));

    const { container } = render(<StokSaatIniPage />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByTestId('stock-table')).not.toBeInTheDocument();
  });

  it('2. Berhasil fetching data dan merender elemen utama beserta child components', async () => {
    render(<StokSaatIniPage />);

    // Gunakan findByTestId agar Jest menunggu hingga state loading selesai & komponen ter-render
    const summaryEl = await screen.findByTestId('inventory-summary');
    expect(summaryEl).toHaveTextContent('Summary Total: 10');

    expect(screen.getByTestId('stock-table')).toBeInTheDocument();
    expect(screen.getByTestId('stock-count')).toHaveTextContent('3 Items');

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/cooperative/inventory/overview',
      expect.objectContaining({
        headers: { Authorization: 'Bearer mock_token_123' },
      })
    );
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/cooperative/fertilizers',
      expect.objectContaining({
        headers: { Authorization: 'Bearer mock_token_123' },
      })
    );
  });

  it('3. Menyaring daftar stok berdasarkan query pencarian (Search Input)', async () => {
    render(<StokSaatIniPage />);

    // Pastikan data awal selesai di-load
    await screen.findByTestId('stock-table');
    expect(screen.getByTestId('stock-count')).toHaveTextContent('3 Items');

    const searchInput = screen.getByPlaceholderText('Cari pupuk....');
    fireEvent.change(searchInput, { target: { value: 'Urea' } });

    expect(screen.getByTestId('stock-count')).toHaveTextContent('1 Items');
    expect(screen.getByText(/Pupuk Urea/i)).toBeInTheDocument();
    expect(screen.queryByText(/Pupuk NPK/i)).not.toBeInTheDocument();
  });

  it('4. Memfilter stok berdasarkan status (Tersedia, Menipis, Habis)', async () => {
    render(<StokSaatIniPage />);

    await screen.findByTestId('stock-table');
    expect(screen.getByTestId('stock-count')).toHaveTextContent('3 Items');

    // Buka Filter Dropdown
    const filterBtn = screen.getByRole('button', { name: /filter/i });
    fireEvent.click(filterBtn);

    const statusSelect = screen.getByRole('combobox', { name: /status stok/i });

    // Test Status: Menipis (1-200 kg)
    fireEvent.change(statusSelect, { target: { value: 'menipis' } });
    expect(screen.getByTestId('stock-count')).toHaveTextContent('1 Items');
    expect(screen.getByText(/Pupuk NPK/i)).toBeInTheDocument();

    // Test Status: Habis (0 kg)
    fireEvent.change(statusSelect, { target: { value: 'habis' } });
    expect(screen.getByTestId('stock-count')).toHaveTextContent('1 Items');
    expect(screen.getByText(/Pupuk ZA/i)).toBeInTheDocument();

    // Test Status: Tersedia (> 200 kg)
    fireEvent.change(statusSelect, { target: { value: 'tersedia' } });
    expect(screen.getByTestId('stock-count')).toHaveTextContent('1 Items');
    expect(screen.getByText(/Pupuk Urea/i)).toBeInTheDocument();
  });

  it('5. Mengurutkan daftar stok berdasarkan harga (Tertinggi & Terendah)', async () => {
    render(<StokSaatIniPage />);

    await screen.findByTestId('stock-table');
    expect(screen.getByTestId('stock-count')).toHaveTextContent('3 Items');

    // Buka Dropdown Filter
    fireEvent.click(screen.getByRole('button', { name: /filter/i }));
    const priceSelect = screen.getByRole('combobox', { name: /urutan harga/i });

    // Urutkan Harga Tertinggi
    fireEvent.change(priceSelect, { target: { value: 'highest' } });
    let items = screen.getAllByTestId('stock-item');
    expect(items[0]).toHaveTextContent('Pupuk NPK'); // Rp 15.000
    expect(items[2]).toHaveTextContent('Pupuk ZA'); // Rp 8.000

    // Urutkan Harga Terendah
    fireEvent.change(priceSelect, { target: { value: 'lowest' } });
    items = screen.getAllByTestId('stock-item');
    expect(items[0]).toHaveTextContent('Pupuk ZA'); // Rp 8.000
    expect(items[2]).toHaveTextContent('Pupuk NPK'); // Rp 15.000
  });

  it('6. Menjalankan analisis/prediksi AI (ML Procurement) saat tombol diklik', async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: { recommendation: 'Restock NPK 500kg' },
      },
    });

    render(<StokSaatIniPage />);

    await screen.findByTestId('stock-table');

    const aiBtn = screen.getByRole('button', { name: /prediksi pengadaan ml/i });
    fireEvent.click(aiBtn);

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/cooperative/inventory/fertilizers/predict-all',
        {},
        expect.objectContaining({
          headers: { Authorization: 'Bearer mock_token_123' },
        })
      );
    });

    expect(await screen.findByTestId('ai-panel')).toBeInTheDocument();
    expect(screen.getByTestId('ai-panel')).toHaveTextContent('Restock NPK 500kg');
  });

  it('7. Melakukan scroll otomatis ke area tabel saat tombol "Kelola Pupuk" diklik', async () => {
    render(<StokSaatIniPage />);

    await screen.findByTestId('stock-table');

    const manageBtn = screen.getByRole('button', { name: /kelola pupuk/i });
    fireEvent.click(manageBtn);

    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });

  it('8. Menutup dropdown filter ketika diklik di luar area dropdown (Click Outside)', async () => {
    render(<StokSaatIniPage />);

    await screen.findByTestId('stock-table');

    const filterBtn = screen.getByRole('button', { name: /filter/i });
    fireEvent.click(filterBtn);

    expect(screen.getByRole('combobox', { name: /status stok/i })).toBeInTheDocument();

    // Trigger click outside di body
    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('combobox', { name: /status stok/i })).not.toBeInTheDocument();
  });

  it('9. Menangani kegagalan saat fetch data API', async () => {
    const spyConsole = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedApi.get.mockRejectedValueOnce(new Error('Network Error'));

    render(<StokSaatIniPage />);

    await waitFor(() => {
      expect(spyConsole).toHaveBeenCalledWith(
        'Gagal mengambil data inventaris:',
        expect.any(Error)
      );
    });

    spyConsole.mockRestore();
  });
});