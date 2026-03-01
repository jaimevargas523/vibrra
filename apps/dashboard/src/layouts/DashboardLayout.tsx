import { Suspense, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import clsx from "clsx";
import { Smartphone } from "lucide-react";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useEstablecimientos } from "@/hooks/api/useEstablecimientos";
import { useEstablishmentStore } from "@/stores/establishment.store";

export default function DashboardLayout() {
  const isMobile = useMediaQuery("(max-width: 899px)");
  const location = useLocation();
  const navigate = useNavigate();

  // Sync establishments from API to Zustand store (used by sidebar selector)
  const { data: establecimientos } = useEstablecimientos();
  const setEstablishments = useEstablishmentStore((s) => s.setEstablishments);

  useEffect(() => {
    if (establecimientos) {
      setEstablishments(establecimientos);
    }
  }, [establecimientos, setEstablishments]);

  const isRecargarCliente = location.pathname === "/anfitrion/recargar-cliente";

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div
        className={clsx(
          "flex flex-col flex-1 min-w-0 transition-all",
          !isMobile && "ml-[280px]",
        )}
      >
        <Topbar />

        <main className="flex-1 overflow-y-auto p-6">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* FAB: Recargar cliente */}
      {!isRecargarCliente && (
        <button
          type="button"
          onClick={() => navigate("/anfitrion/recargar-cliente")}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gold text-bg shadow-lg hover:bg-gold/90 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          aria-label="Recargar cliente"
        >
          <Smartphone className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
