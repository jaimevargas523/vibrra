import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { AuthGuard } from "@/components/auth/AuthGuard";

// Lazy-loaded layout
const DashboardLayout = lazy(() => import("@/layouts/DashboardLayout"));

// Lazy-loaded pages
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const ResumenPage = lazy(() => import("@/pages/ResumenPage"));
const EnVivoPage = lazy(() => import("@/pages/EnVivoPage"));
const SesionesPage = lazy(() => import("@/pages/SesionesPage"));
const QrsPage = lazy(() => import("@/pages/QrsPage"));
const MovimientosPage = lazy(() => import("@/pages/MovimientosPage"));
const RecargarPage = lazy(() => import("@/pages/RecargarPage"));
const BonificacionesPage = lazy(() => import("@/pages/BonificacionesPage"));
const EstablecimientosPage = lazy(() => import("@/pages/EstablecimientosPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const CuentaPage = lazy(() => import("@/pages/CuentaPage"));
const EstablecimientoDetallePage = lazy(() => import("@/pages/EstablecimientoDetallePage"));
const RecargarClientePage = lazy(() => import("@/pages/RecargarClientePage"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/anfitrion" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "anfitrion",
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <ResumenPage /> },
      { path: "envivo", element: <EnVivoPage /> },
      { path: "sesiones", element: <SesionesPage /> },
      { path: "qrs", element: <QrsPage /> },
      { path: "movimientos", element: <MovimientosPage /> },
      { path: "recargar", element: <RecargarPage /> },
      { path: "recargar-cliente", element: <RecargarClientePage /> },
      { path: "bonificaciones", element: <BonificacionesPage /> },
      { path: "establecimientos", element: <EstablecimientosPage /> },
      { path: "establecimientos/:id", element: <EstablecimientoDetallePage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "cuenta", element: <CuentaPage /> },
    ],
  },
]);
