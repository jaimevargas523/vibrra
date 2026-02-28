import type { CountryConfig } from "../types";
import { CO } from "./CO";

/** Registry of all supported countries */
export const COUNTRIES: Record<string, CountryConfig> = {
  CO,
};

/** Ordered list for the country-selector step */
export const COUNTRY_LIST: CountryConfig[] = [CO];

/** Get a country config by ISO code. Throws if not found. */
export function getCountryConfig(code: string): CountryConfig {
  const cfg = COUNTRIES[code];
  if (!cfg) throw new Error(`Country "${code}" is not supported yet.`);
  return cfg;
}

/** Check whether a country code is supported */
export function isCountrySupported(code: string): boolean {
  return code in COUNTRIES;
}
