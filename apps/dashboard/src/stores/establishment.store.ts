import { create } from "zustand";

export interface Establishment {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
  isActive: boolean;
  imageUrl?: string | null;
}

interface EstablishmentState {
  selectedId: string | null;
  establishments: Establishment[];
  setEstablishments: (establishments: Establishment[]) => void;
  select: (id: string) => void;
  getSelected: () => Establishment | null;
}

export const useEstablishmentStore = create<EstablishmentState>((set, get) => ({
  selectedId: null,
  establishments: [],

  setEstablishments: (establishments) => {
    set({ establishments });
    // Auto-select first if none selected
    const { selectedId } = get();
    if (!selectedId && establishments.length > 0) {
      set({ selectedId: establishments[0].id });
    }
  },

  select: (id) => set({ selectedId: id }),

  getSelected: () => {
    const { selectedId, establishments } = get();
    if (!selectedId) return null;
    return establishments.find((e) => e.id === selectedId) ?? null;
  },
}));
