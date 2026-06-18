import { create } from "zustand";
import { EyeResult, SkinResult, FishSpecies } from "../types";

interface ScanState {
  currentSpecies: FishSpecies | null;
  eyeResult: EyeResult | null;
  skinResult: SkinResult | null;
  setCurrentSpecies: (species: FishSpecies) => void;
  setEyeResult: (result: EyeResult) => void;
  setSkinResult: (result: SkinResult) => void;
  clearScan: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  currentSpecies: null,
  eyeResult: null,
  skinResult: null,
  setCurrentSpecies: (species) => set({ currentSpecies: species }),
  setEyeResult: (result) => set({ eyeResult: result }),
  setSkinResult: (result) => set({ skinResult: result }),
  clearScan: () =>
    set({
      currentSpecies: null,
      eyeResult: null,
      skinResult: null,
    }),
}));