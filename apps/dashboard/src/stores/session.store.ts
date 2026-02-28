import { create } from "zustand";

export interface QueueItem {
  id: string;
  songTitle: string;
  artistName: string;
  requestedBy: string;
  amount: number;
  status: "pending" | "playing" | "done" | "skipped";
  createdAt: string;
}

export interface CurrentSong {
  id: string;
  title: string;
  artist: string;
  requestedBy: string;
  amount: number;
  startedAt: string;
}

interface SessionState {
  isLive: boolean;
  sessionId: string | null;
  queue: QueueItem[];
  connectedUsers: number;
  currentSong: CurrentSong | null;
  totalRecaudado: number;
  startedAt: string | null;

  setLive: (isLive: boolean, sessionId?: string | null) => void;
  setQueue: (queue: QueueItem[]) => void;
  addToQueue: (item: QueueItem) => void;
  updateQueueItem: (id: string, updates: Partial<QueueItem>) => void;
  removeFromQueue: (id: string) => void;
  setConnectedUsers: (count: number) => void;
  setCurrentSong: (song: CurrentSong | null) => void;
  setTotalRecaudado: (total: number) => void;
  addToRecaudado: (amount: number) => void;
  setStartedAt: (startedAt: string | null) => void;
  endSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isLive: false,
  sessionId: null,
  queue: [],
  connectedUsers: 0,
  currentSong: null,
  totalRecaudado: 0,
  startedAt: null,

  setLive: (isLive, sessionId = null) => set({ isLive, sessionId }),

  setQueue: (queue) => set({ queue }),

  addToQueue: (item) =>
    set((s) => ({ queue: [...s.queue, item] })),

  updateQueueItem: (id, updates) =>
    set((s) => ({
      queue: s.queue.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    })),

  removeFromQueue: (id) =>
    set((s) => ({ queue: s.queue.filter((q) => q.id !== id) })),

  setConnectedUsers: (count) => set({ connectedUsers: count }),

  setCurrentSong: (song) => set({ currentSong: song }),

  setTotalRecaudado: (total) => set({ totalRecaudado: total }),

  addToRecaudado: (amount) =>
    set((s) => ({ totalRecaudado: s.totalRecaudado + amount })),

  setStartedAt: (startedAt) => set({ startedAt }),

  endSession: () =>
    set({
      isLive: false,
      sessionId: null,
      queue: [],
      connectedUsers: 0,
      currentSong: null,
      totalRecaudado: 0,
      startedAt: null,
    }),
}));
