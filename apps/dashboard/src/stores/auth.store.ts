import { create } from "zustand";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  injectToken: (token: string) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();
      set({ user: credential.user, token, loading: false, error: null });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al iniciar sesion";
      set({ loading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, token: null, loading: false, error: null });
    } catch (err) {
      console.error("Error signing out:", err);
    }
  },

  refreshToken: async () => {
    const { user } = get();
    if (!user) return null;
    try {
      const token = await user.getIdToken(true);
      set({ token });
      return token;
    } catch {
      set({ token: null });
      return null;
    }
  },

  injectToken: (token: string) => {
    set({ token, loading: false, error: null });
  },

  clearError: () => set({ error: null }),
}));

// Auto-update on auth state changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdToken();
    useAuthStore.setState({ user, token, loading: false });
  } else {
    useAuthStore.setState({ user: null, token: null, loading: false });
  }
});
