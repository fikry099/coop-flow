import { create } from 'zustand';

interface LandState {
  currentView: 'dashboard' | 'lands' | 'land-detail';
  selectedLand: any | null;
  setCurrentView: (view: 'dashboard' | 'lands' | 'land-detail') => void;
  setSelectedLand: (land: any | null) => void;
}

export const useLandStore = create<LandState>((set) => ({
  currentView: 'dashboard',
  selectedLand: null,
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedLand: (land) => set({ selectedLand: land }),
}));