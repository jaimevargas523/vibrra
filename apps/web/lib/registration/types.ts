/* ── Country-config type system for multi-country host registration ── */

/** A single identity-document type (e.g. CC, CE, PA for Colombia) */
export interface IdentityDocConfig {
  /** Internal value stored in Firestore */
  value: string;
  /** i18n key inside "registro.step2" namespace, e.g. "tipoDocCC" */
  i18nKey: string;
}

/** A tax-regime option */
export interface TaxRegimeConfig {
  value: string;
  i18nKey: string;
}

/** A person-type option (natural / juridica, etc.) */
export interface PersonTypeConfig {
  value: string;
  i18nKey: string;
  descI18nKey: string;
}

/** A bank or payment institution */
export interface BankConfig {
  /** i18n key in "registro.step4" namespace, e.g. "bancolombia" */
  key: string;
  icon: string;
}

/** An account type option */
export interface AccountTypeConfig {
  value: string;
  i18nKey: string;
}

/** A tax document required by the country (e.g. RUT for CO) */
export interface TaxDocConfig {
  /** i18n key prefix used in "registro.step3", e.g. "rut" → rutInfo, rutUploadTitle, etc. */
  i18nPrefix: string;
  /** Whether the document is mandatory */
  required: boolean;
  /** Allowed MIME types */
  accepts: string[];
}

/** A mandatory or optional legal acceptance toggle */
export interface LegalDocConfig {
  /** Key used in formData and i18n, e.g. "terminos", "datos" */
  key: string;
  /** Whether the user must accept to proceed */
  required: boolean;
  /** Link to the full document (optional) */
  linkUrl?: string;
}

/** Country-level phone prefix */
export interface PhonePrefixConfig {
  code: string;
  label: string;
}

/** Currency display */
export interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
}

/** Country-specific validation patterns */
export interface ValidationConfig {
  /** Regex to validate the tax ID (NIT for CO) */
  taxId?: RegExp;
  /** Regex to validate the identity doc number */
  docNumber?: RegExp;
  /** Regex to validate the bank account number */
  accountNumber?: RegExp;
}

/** IVA / VAT section config */
export interface VatConfig {
  /** Whether this country has a VAT/IVA question in the tax step */
  enabled: boolean;
}

/* ── Master config per country ── */

export interface CountryConfig {
  /** ISO 3166-1 alpha-2 code, e.g. "CO" */
  code: string;
  /** Country name i18n key inside "registro.step0" namespace */
  nameI18nKey: string;
  /** Flag emoji */
  flag: string;
  /** Default phone prefix */
  defaultPhonePrefix: string;
  /** All phone prefixes available to this country */
  phonePrefixes: PhonePrefixConfig[];
  /** Currency display */
  currency: CurrencyConfig;

  /** Identity step (Step 2) */
  identityDocs: IdentityDocConfig[];

  /** Tax step (Step 3) */
  personTypes: PersonTypeConfig[];
  taxRegimes: TaxRegimeConfig[];
  taxDoc: TaxDocConfig | null;
  vat: VatConfig;

  /** Bank step (Step 4) */
  banks: BankConfig[];
  accountTypes: AccountTypeConfig[];

  /** Legal step (Step 5) */
  legalDocs: LegalDocConfig[];

  /** Validations */
  validations: ValidationConfig;

  /** Subscription pricing display */
  subscriptionPrice: string;
  activationBonus: number;
}

/* ── Extended FormData for multi-country ── */

export interface RegistrationFormData {
  // Step 0 — Country
  country: string;
  // Step 1 — Account
  email: string;
  password: string;
  // Step 2 — Identity
  nombres: string;
  apellidos: string;
  tipoDoc: string;
  numeroDoc: string;
  fechaNac: string;
  celular: string;
  docFrontal: File | null;
  docPosterior: File | null;
  selfie: File | null;
  // Step 3 — Tax
  tipoPersona: string;
  nit: string;
  regimen: string;
  responsableIva: boolean;
  rutFile: File | null;
  // Step 4 — Bank
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  titularCuenta: string;
  // Step 5 — Legal
  legalAcceptances: Record<string, boolean>;
  recibeReportes: boolean;
}

export const INITIAL_REGISTRATION_DATA: RegistrationFormData = {
  country: "",
  email: "",
  password: "",
  nombres: "",
  apellidos: "",
  tipoDoc: "",
  numeroDoc: "",
  fechaNac: "",
  celular: "",
  docFrontal: null,
  docPosterior: null,
  selfie: null,
  tipoPersona: "natural",
  nit: "",
  regimen: "",
  responsableIva: false,
  rutFile: null,
  banco: "",
  tipoCuenta: "",
  numeroCuenta: "",
  titularCuenta: "",
  legalAcceptances: {},
  recibeReportes: false,
};
