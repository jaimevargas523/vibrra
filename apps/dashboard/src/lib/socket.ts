import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/auth.store";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
  socket = io(`${baseUrl}/sesion`, {
    autoConnect: false,
    transports: ["websocket", "polling"],
    auth: async (cb) => {
      let token = useAuthStore.getState().token;
      if (!token) {
        token = await useAuthStore.getState().refreshToken();
      }
      cb({ token });
    },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect", () => {
    console.log("[socket] connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[socket] disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("[socket] connection error:", err.message);
  });

  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
