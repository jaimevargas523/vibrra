import { lazy } from "react";
import { createBrowserRouter } from "react-router";
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
const SuscripcionPage = lazy(() => import("@/pages/SuscripcionPage"));
const EstablecimientosPage = lazy(() => import("@/pages/EstablecimientosPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const CuentaPage = lazy(() => import("@/pages/CuentaPage"));
const DocumentosPage = lazy(() => import("@/pages/DocumentosPage"));
const EstablecimientoDetallePage = lazy(() => import("@/pages/EstablecimientoDetallePage"));

export const router = createBrowserRouter([
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
      { path: "bonificaciones", element: <BonificacionesPage /> },
      { path: "suscripcion", element: <SuscripcionPage /> },
      { path: "establecimientos", element: <EstablecimientosPage /> },
      { path: "establecimientos/:id", element: <EstablecimientoDetallePage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "cuenta", element: <CuentaPage /> },
      { path: "documentos", element: <DocumentosPage /> },
    ],
  },
]);
