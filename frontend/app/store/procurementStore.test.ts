import { useProcurementStore } from "./useProcurementStore"; // Sesuaikan nama file ke useProcurementStore

describe("Procurement Zustand Store Unit Test", () => {
  beforeEach(() => {
    // Reset state store ke nilai awal sebelum setiap test
    useProcurementStore.setState({ selectedId: null });
  });

  it("1. Harus inisialisasi dengan selectedId bertipe null", () => {
    const state = useProcurementStore.getState();
    expect(state.selectedId).toBeNull();
  });

  it("2. Harus berhasil mengubah selectedId ketika setSelectedId dipanggil", () => {
    useProcurementStore.getState().setSelectedId(105);
    expect(useProcurementStore.getState().selectedId).toBe(105);
  });

  it("3. Harus dapat mengosongkan kembali selectedId menjadi null", () => {
    useProcurementStore.getState().setSelectedId(200);
    expect(useProcurementStore.getState().selectedId).toBe(200);

    useProcurementStore.getState().setSelectedId(null);
    expect(useProcurementStore.getState().selectedId).toBeNull();
  });
});