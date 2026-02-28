import type { CountryConfig } from "../types";

export const CO: CountryConfig = {
  code: "CO",
  nameI18nKey: "colombia",
  flag: "\u{1F1E8}\u{1F1F4}",
  defaultPhonePrefix: "+57",
  phonePrefixes: [
    { code: "+57", label: "\u{1F1E8}\u{1F1F4} +57" },
    { code: "+1", label: "\u{1F1FA}\u{1F1F8} +1" },
    { code: "+52", label: "\u{1F1F2}\u{1F1FD} +52" },
    { code: "+55", label: "\u{1F1E7}\u{1F1F7} +55" },
    { code: "+34", label: "\u{1F1EA}\u{1F1F8} +34" },
    { code: "+51", label: "\u{1F1F5}\u{1F1EA} +51" },
    { code: "+56", label: "\u{1F1E8}\u{1F1F1} +56" },
    { code: "+54", label: "\u{1F1E6}\u{1F1F7} +54" },
    { code: "+593", label: "\u{1F1EA}\u{1F1E8} +593" },
    { code: "+507", label: "\u{1F1F5}\u{1F1E6} +507" },
    { code: "+58", label: "\u{1F1FB}\u{1F1EA} +58" },
    { code: "+506", label: "\u{1F1E8}\u{1F1F7} +506" },
    { code: "+502", label: "\u{1F1EC}\u{1F1F9} +502" },
    { code: "+591", label: "\u{1F1E7}\u{1F1F4} +591" },
    { code: "+595", label: "\u{1F1F5}\u{1F1FE} +595" },
    { code: "+598", label: "\u{1F1FA}\u{1F1FE} +598" },
    { code: "+503", label: "\u{1F1F8}\u{1F1FB} +503" },
    { code: "+504", label: "\u{1F1ED}\u{1F1F3} +504" },
    { code: "+505", label: "\u{1F1F3}\u{1F1EE} +505" },
  ],
  currency: { code: "COP", symbol: "$", locale: "es-CO" },

  /* ── Step 2: Identity ── */
  identityDocs: [
    { value: "CC", i18nKey: "tipoDocCC" },
    { value: "CE", i18nKey: "tipoDocCE" },
    { value: "PA", i18nKey: "tipoDocPA" },
  ],

  /* ── Step 3: Tax ── */
  personTypes: [
    { value: "natural", i18nKey: "natural", descI18nKey: "naturalDesc" },
    { value: "juridica", i18nKey: "juridica", descI18nKey: "juridicaDesc" },
  ],
  taxRegimes: [
    { value: "simple", i18nKey: "regimenSimple" },
    { value: "ordinario", i18nKey: "regimenOrdinario" },
    { value: "no_iva", i18nKey: "regimenNoIva" },
  ],
  taxDoc: {
    i18nPrefix: "rut",
    required: false,
    accepts: ["image/jpeg", "image/png", "application/pdf"],
  },
  vat: { enabled: true },

  /* ── Step 4: Bank ── */
  banks: [
    { key: "bancolombia", icon: "\u{1F3E6}" },
    { key: "bogota", icon: "\u{1F3E6}" },
    { key: "davivienda", icon: "\u{1F3E6}" },
    { key: "nequi", icon: "\u{1F49A}" },
    { key: "daviplata", icon: "\u{1F499}" },
    { key: "bbva", icon: "\u{1F3E6}" },
    { key: "scotiabank", icon: "\u{1F3E6}" },
    { key: "avvillas", icon: "\u{1F3E6}" },
    { key: "otroBanco", icon: "\u{1F3E6}" },
  ],
  accountTypes: [
    { value: "ahorros", i18nKey: "cuentaAhorros" },
    { value: "corriente", i18nKey: "cuentaCorriente" },
    { value: "digital", i18nKey: "billeteraDigital" },
  ],

  /* ── Step 5: Legal ── */
  legalDocs: [
    { key: "terminos", required: true, linkUrl: "/legal/CO/vibrra-terminos.html" },
    { key: "datos", required: true, linkUrl: "/legal/CO/vibrra-politica-datos.html" },
    { key: "pagos", required: true },
    { key: "publicidad", required: true },
  ],

  /* ── Validations ── */
  validations: {
    taxId: /^\d{6,10}(-\d)?$/,
    docNumber: /^\d{6,12}$/,
    accountNumber: /^\d{8,20}$/,
  },

  /* ── Pricing ── */
  subscriptionPrice: "$15.000",
  activationBonus: 30_000,
};
