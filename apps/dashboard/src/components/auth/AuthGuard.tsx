import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "@/stores/auth.store";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const loading = useAuthStore((s) => s.loading);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <span className="font-display text-lg text-gold">VIBRRA</span>
        </div>
      </div>
    );
  }

  if (!user && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
