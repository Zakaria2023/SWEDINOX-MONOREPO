import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes safely, resolving conflicts.
 * Pass any mix of strings, arrays, or conditional objects.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/**
 * Returns today's date as a YYYY-MM-DD string.
 */
export const todayDateString = () => new Date().toISOString().split("T")[0];

/**
 * Returns the current calendar year.
 */
export const currentYear = () => new Date().getFullYear();

/**
 * Generates a random UUID v4.
 */
export const generateUuid = () => crypto.randomUUID();

/**
 * Returns the singular or plural form based on a count.
 */
export const pluralize = (
  count: number,
  singular: string,
  plural = `${singular}s`,
) => (count === 1 ? singular : plural);

export const formatRevenue = (value: string | null) => {
  if (!value) return "€ 0,00";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));
};

/**
 * Reduces rows carrying a `companyUuid` into a lookup keyed by that uuid,
 * keeping the first row seen per company. Works both for pre-aggregated
 * rows (one row per company after a `GROUP BY`) and for ordered one-to-many
 * rows where the first row per company is the one you want (e.g. addresses
 * ordered by sequence number, to pick the primary one).
 */
export const toMapByCompanyUuid = <T extends { companyUuid: string | null }>(
  rows: T[],
): Map<string, T> => {
  const map = new Map<string, T>();
  for (const row of rows) {
    if (row.companyUuid && !map.has(row.companyUuid)) {
      map.set(row.companyUuid, row);
    }
  }
  return map;
};
