import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { router } from "@/router";
import "@/i18n";
import "@/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppLoading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        <span className="font-display text-lg text-gold">VIBRRA</span>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<AppLoading />}>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>
  </StrictMode>
);
