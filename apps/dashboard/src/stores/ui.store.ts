import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  notificationsOpen: boolean;
  activeModal: string | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleNotifications: () => void;
  setNotificationsOpen: (open: boolean) => void;
  openModal: (id: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  notificationsOpen: false,
  activeModal: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleNotifications: () =>
    set((s) => ({ notificationsOpen: !s.notificationsOpen })),
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),

  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}));
