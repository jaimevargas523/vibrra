import { Suspense } from "react";
import { Outlet } from "react-router";
import clsx from "clsx";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function DashboardLayout() {
  const isMobile = useMediaQuery("(max-width: 899px)");

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
    </div>
  );
}
