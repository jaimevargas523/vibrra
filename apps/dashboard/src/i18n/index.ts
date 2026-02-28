import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// ES namespaces
import esCommon from "./locales/es/common.json";
import esResumen from "./locales/es/resumen.json";
import esEnvivo from "./locales/es/envivo.json";
import esSesiones from "./locales/es/sesiones.json";
import esQrs from "./locales/es/qrs.json";
import esMovimientos from "./locales/es/movimientos.json";
import esRecargar from "./locales/es/recargar.json";
import esBonificaciones from "./locales/es/bonificaciones.json";
import esSuscripcion from "./locales/es/suscripcion.json";
import esEstablecimientos from "./locales/es/establecimientos.json";
import esAnalytics from "./locales/es/analytics.json";
import esCuenta from "./locales/es/cuenta.json";
import esDocumentos from "./locales/es/documentos.json";

// EN namespaces
import enCommon from "./locales/en/common.json";
import enResumen from "./locales/en/resumen.json";
import enEnvivo from "./locales/en/envivo.json";
import enSesiones from "./locales/en/sesiones.json";
import enQrs from "./locales/en/qrs.json";
import enMovimientos from "./locales/en/movimientos.json";
import enRecargar from "./locales/en/recargar.json";
import enBonificaciones from "./locales/en/bonificaciones.json";
import enSuscripcion from "./locales/en/suscripcion.json";
import enEstablecimientos from "./locales/en/establecimientos.json";
import enAnalytics from "./locales/en/analytics.json";
import enCuenta from "./locales/en/cuenta.json";
import enDocumentos from "./locales/en/documentos.json";

// PT namespaces
import ptCommon from "./locales/pt/common.json";
import ptResumen from "./locales/pt/resumen.json";
import ptEnvivo from "./locales/pt/envivo.json";
import ptSesiones from "./locales/pt/sesiones.json";
import ptQrs from "./locales/pt/qrs.json";
import ptMovimientos from "./locales/pt/movimientos.json";
import ptRecargar from "./locales/pt/recargar.json";
import ptBonificaciones from "./locales/pt/bonificaciones.json";
import ptSuscripcion from "./locales/pt/suscripcion.json";
import ptEstablecimientos from "./locales/pt/establecimientos.json";
import ptAnalytics from "./locales/pt/analytics.json";
import ptCuenta from "./locales/pt/cuenta.json";
import ptDocumentos from "./locales/pt/documentos.json";

export const namespaces = [
  "common",
  "resumen",
  "envivo",
  "sesiones",
  "qrs",
  "movimientos",
  "recargar",
  "bonificaciones",
  "suscripcion",
  "establecimientos",
  "analytics",
  "cuenta",
  "documentos",
] as const;

const resources = {
  es: {
    common: esCommon,
    resumen: esResumen,
    envivo: esEnvivo,
    sesiones: esSesiones,
    qrs: esQrs,
    movimientos: esMovimientos,
    recargar: esRecargar,
    bonificaciones: esBonificaciones,
    suscripcion: esSuscripcion,
    establecimientos: esEstablecimientos,
    analytics: esAnalytics,
    cuenta: esCuenta,
    documentos: esDocumentos,
  },
  en: {
    common: enCommon,
    resumen: enResumen,
    envivo: enEnvivo,
    sesiones: enSesiones,
    qrs: enQrs,
    movimientos: enMovimientos,
    recargar: enRecargar,
    bonificaciones: enBonificaciones,
    suscripcion: enSuscripcion,
    establecimientos: enEstablecimientos,
    analytics: enAnalytics,
    cuenta: enCuenta,
    documentos: enDocumentos,
  },
  pt: {
    common: ptCommon,
    resumen: ptResumen,
    envivo: ptEnvivo,
    sesiones: ptSesiones,
    qrs: ptQrs,
    movimientos: ptMovimientos,
    recargar: ptRecargar,
    bonificaciones: ptBonificaciones,
    suscripcion: ptSuscripcion,
    establecimientos: ptEstablecimientos,
    analytics: ptAnalytics,
    cuenta: ptCuenta,
    documentos: ptDocumentos,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "es",
    supportedLngs: ["es", "en", "pt"],
    defaultNS: "common",
    ns: [...namespaces],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "vibrra-lang",
    },
  });

export default i18n;
