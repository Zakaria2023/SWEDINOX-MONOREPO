import { clsx, ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  AgeingBucket,
  ageingBuckets,
  CertificaatOption,
  ContractableRole,
  contractableRoles,
  ContractType,
  ComplaintCategory,
  ComplaintSolution,
  CustomerGroup,
  DeliveryTerm,
  DeliveryTimeUnit,
  DeliveryType,
  InvoicePaymentTerm,
  InvoiceDocumentType,
  InvoiceVatScenario,
  LeadTimeMethod,
  OrderDeblockType,
  OrderLineStatus,
  OrderWeightType,
  PurchaseOrderStatus,
  PurchaseQuoteStatus,
  PurchaseRequestStatus,
  ReminderStage,
  reminderStages,
  ReturnOrderReason,
  ReturnOrderStatus,
  SalesRepresentative,
  SfnCounterpartyRole,
  StockMode,
  StockUnit,
  StockMovementType,
  TextUsageCategory,
  TransporterPriceUnit,
  VatCode,
} from "./enums";
import {
  CONTRACT_TYPE_LABELS,
  CUSTOMER_GROUP_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  ORDER_DEBLOCK_TYPE_LABELS,
  ORDER_LINE_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
  SALES_REPRESENTATIVE_LABELS,
  STOCK_UNIT_LABELS,
  TEXT_USAGE_CATEGORY_LABELS,
} from "./labels";

/**
 * Merges Tailwind classes safely, resolving conflicts.
 * Pass any mix of strings, arrays, or conditional objects.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/**
 * A readable error message for a server-action catch block: the human-friendly
 * fallback, followed by the underlying error's own message when there is one.
 * Used so a failed query surfaces its real cause to the client (e.g. a missing
 * column or a connection timeout) instead of only a generic "Failed to …".
 */
export const describeError = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message
    ? `${fallback}: ${error.message}`
    : fallback;

/**
 * Returns today's date as a YYYY-MM-DD string.
 */
export const todayDateString = () => new Date().toISOString().split("T")[0];

/**
 * Returns the current calendar year.
 */
export const currentYear = () => new Date().getFullYear();

export const toDecimal = (
  value: string | undefined,
  fallback: string,
): string => (value && value.trim() !== "" ? value : fallback);

/**
 * The shape a hand-typed money field has to have before it can be stored in a
 * `decimal` column: an optional sign, digits, and at most two decimals after a
 * dot or a comma. Shared by the zod schemas that validate such a field and by
 * `toDecimalAmount` below, so the check and the conversion can't drift apart.
 */
export const DECIMAL_AMOUNT_PATTERN = /^-?\d+(?:[.,]\d{1,2})?$/;

/**
 * A hand-typed money field as the plain decimal string MySQL accepts: trimmed,
 * with a comma decimal separator rewritten as a dot.
 *
 * A blank field — or one holding something that isn't an amount at all —
 * becomes `fallback`. Validation should have caught the latter first; this is
 * the second line of defence, because a stray string reaching a `decimal`
 * column fails the whole insert, and on the company form that insert is one
 * statement inside a transaction that creates everything else too.
 */
export const toDecimalAmount = (
  value: string | null | undefined,
  fallback = "0.00",
): string => {
  const trimmed = (value ?? "").trim();
  if (!DECIMAL_AMOUNT_PATTERN.test(trimmed)) {
    return fallback;
  }
  return trimmed.replace(",", ".");
};

export const toIntOrNull = (value: string | undefined): number | null =>
  value !== undefined && value.trim() !== "" ? Number(value) : null;

export const asNumber = (v: string) => (v === "" ? "" : Number(v));

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

export const buildColumnVisibility = <K extends string>(
  columns: Array<{ key: K; defaultVisible: boolean }>,
): Record<K, boolean> =>
  Object.fromEntries(
    columns.map((col) => [col.key, col.defaultVisible]),
  ) as Record<K, boolean>;

// ---------------------------------------------------------------------------
// Table queries
//
// Every overview is searched, filtered, sorted and paged on the server, and the
// state of that view lives in the URL rather than in component state. Three
// things follow from that, and all three are the reason for it:
//
//   - Only the rows being looked at cross the wire. Several of these tables —
//     order lines, journal entries, stock movements — grow without bound, and
//     the alternative is shipping the whole table to the browser to sift there.
//   - A view is a link. "The blocked orders for this customer" can be sent to
//     somebody rather than described to them.
//   - It survives the router.refresh() a row action triggers, because the
//     server component re-runs against the same search params.
//
// The helpers below are the whole contract between a page's search params and
// the action that reads them. Nothing here knows about any particular overview:
// each one declares which columns it searches and sorts on, and the shared
// machinery does the rest.
// ---------------------------------------------------------------------------

export type SortDirection = "asc" | "desc";

/** The state of one table view, parsed out of the URL. */
export type TableQuery = {
  /** 1-based, always at least 1. */
  page: number;
  pageSize: number;
  /** A column key the overview declared as sortable, or null for its default. */
  sort: string | null;
  dir: SortDirection;
  /** The free-text term, trimmed; null when the box is empty. */
  q: string | null;
  /**
   * Everything else in the URL, always as an array so a single-select and a
   * multi-select filter read the same way.
   */
  filters: Record<string, string[]>;
};

/** One page of rows, plus what it is a page of. */
export type Paged<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** The shape Next hands a page component in searchParams. */
export type SearchParams = Record<string, string | string[] | undefined>;

export const TABLE_PAGE_SIZE = 50;

export const TABLE_PAGE_SIZES = [25, 50, 100, 200] as const;

// The keys the table machinery owns. Anything else in the URL is a filter, so
// an overview can add one without touching the parser.
const RESERVED_TABLE_PARAMS = ["page", "size", "sort", "dir", "q"];

const firstValue = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

const toArray = (value: string | string[] | undefined): string[] => {
  if (value === undefined) {
    return [];
  }
  // A repeated param arrives as an array; a comma-separated one as a string.
  // Both mean the same thing to a multi-select, so both are accepted.
  const values = Array.isArray(value) ? value : value.split(",");
  return values.map((entry) => entry.trim()).filter((entry) => entry !== "");
};

/**
 * The search params as the one shape every list action takes.
 *
 * Every value is clamped rather than trusted. A page of -3, a page size of
 * 100000 and a direction of "sideways" are all things a URL can carry, and each
 * of them reaches SQL if the parser lets it — so an unusable value falls back
 * to the default instead of failing the page.
 *
 * `sort` is passed through as a plain string and is NOT trusted here: it is
 * resolved against the overview's own whitelist of sortable columns on the
 * server, so a key nobody declared sorts by nothing rather than by whatever it
 * happens to spell.
 */
export const parseTableQuery = (params: SearchParams): TableQuery => {
  const page = Number(firstValue(params.page));
  const pageSize = Number(firstValue(params.size));
  const dir = firstValue(params.dir);
  const q = (firstValue(params.q) ?? "").trim();

  const filters: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(params)) {
    if (RESERVED_TABLE_PARAMS.includes(key)) {
      continue;
    }
    const values = toArray(value);
    if (values.length > 0) {
      filters[key] = values;
    }
  }

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: TABLE_PAGE_SIZES.some((size) => size === pageSize)
      ? pageSize
      : TABLE_PAGE_SIZE,
    sort: firstValue(params.sort) || null,
    dir: dir === "desc" ? "desc" : "asc",
    q: q === "" ? null : q,
    filters,
  };
};

/**
 * The query string for the same view with `patch` applied. A null (or empty)
 * value drops the key, which is how a filter is cleared.
 *
 * Any change other than the page itself returns to page one. A filter that
 * narrows the result to two rows must not leave the reader stranded on page
 * nine looking at an empty table and concluding the filter found nothing.
 */
export const tableQueryString = (
  current: URLSearchParams,
  patch: Record<string, string | string[] | null>,
): string => {
  const next = new URLSearchParams(current.toString());

  for (const [key, value] of Object.entries(patch)) {
    next.delete(key);
    const values = value === null ? [] : toArray(value);
    for (const entry of values) {
      next.append(key, entry);
    }
  }

  if (!Object.hasOwn(patch, "page")) {
    next.delete("page");
  }

  return next.toString();
};

/**
 * How many pages a result set has — always at least one, so an empty table
 * reads as "page 1 of 1" rather than "page 1 of 0".
 */
export const totalPages = (total: number, pageSize: number): number =>
  Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

/**
 * What a pager says it is showing: "51–100 of 1,284". An empty result says so
 * in words, since "0–0 of 0" is only arithmetic.
 */
export const pageRangeLabel = <T>(page: Paged<T>, noun = "row"): string => {
  if (page.total === 0) {
    return `No ${pluralize(2, noun)}`;
  }
  const first = (page.page - 1) * page.pageSize + 1;
  const last = Math.min(page.total, first + page.rows.length - 1);
  return `${formatNumber(first)}–${formatNumber(last)} of ${countLabel(
    page.total,
    noun,
  )}`;
};

/** An empty page, for an action that can answer without querying at all. */
export const emptyPage = <T>(query: TableQuery): Paged<T> => ({
  rows: [],
  total: 0,
  page: query.page,
  pageSize: query.pageSize,
});

export const formatRevenue = (value: string | null) => {
  if (!value) return "€ 0,00";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));
};

/**
 * Formats a number as a euro amount for the overviews (always two decimals).
 */
export const formatMoney = (value: number): string =>
  `€ ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/**
 * Formats a quantity/weight for the overviews — thousands separated, trailing
 * zeros dropped.
 */
export const formatNumber = (value: number): string =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

/**
 * Formats a percentage for the overviews, e.g. `12.5%`.
 */
export const formatPercent = (value: number): string =>
  `${formatNumber(value)}%`;

/**
 * A count with the noun it counts — `1 order`, `12 orders` — for the one-line
 * summaries under a figure.
 */
export const countLabel = (
  count: number,
  singular: string,
  plural = `${singular}s`,
): string => `${formatNumber(count)} ${pluralize(count, singular, plural)}`;

// The home country for statistics purposes: a counterparty anywhere else counts
// as "abroad" on the SFN goods-flow return.
const DOMESTIC_COUNTRY_NAMES = ["nl", "nld", "netherlands", "nederland"];

/**
 * Whether a country name/code refers to the home country. A counterparty with
 * no country recorded is treated as domestic, since an unknown address is far
 * more likely to be a local one that was never filled in than an export.
 */
export const isDomesticCountry = (
  country: string | null | undefined,
): boolean => {
  if (!country || country.trim() === "") {
    return true;
  }
  return DOMESTIC_COUNTRY_NAMES.includes(country.trim().toLowerCase());
};

/**
 * Converts a stock quantity to kilograms, which is the unit the goods-flow
 * statistics are reported in. A quantity already counted in kg passes straight
 * through; anything else is weighed with the product's theoretical weight per
 * unit. A product with no theoretical weight contributes nothing rather than
 * silently counting pieces as kilograms.
 */
export const toKilograms = (
  quantity: number,
  unit: StockUnit | null | undefined,
  theoreticalWeightPerUnit: number | null | undefined,
): number => {
  if (unit === "kg") {
    return quantity;
  }
  return quantity * (theoreticalWeightPerUnit ?? 0);
};

/**
 * The certificate a batch was bought with, read off the options the purchase
 * line was ordered under. The processing options name the certificate directly
 * ("certificate_3_1"), so an explicit 3.1 wins; anything else falls back to the
 * 2.1 declaration of compliance that always accompanies the goods.
 */
export const resolveCertificateFromOptions = (
  options: string | null | undefined,
): CertificaatOption => {
  const normalised = (options ?? "").toLowerCase();
  if (normalised.includes("3_1") || normalised.includes("3.1")) {
    return "en10204_3_1";
  }
  return "en10204_2_1";
};

/**
 * The internal charge number a received batch is traced by: the receipt year
 * plus a zero-padded sequence within that year, e.g. `IC-2026-0001`.
 */
export const formatInternalChargeNumber = (
  year: number,
  sequence: number,
): string => `IC-${year}-${String(sequence).padStart(4, "0")}`;

/**
 * The initials of a person's name ("Jan de Vries" -> "JdV"), used by the
 * overviews that print a seller/purchaser as initials.
 */
export const initialsOf = (name: string | null | undefined): string => {
  if (!name) {
    return "—";
  }
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("");
  return initials === "" ? "—" : initials;
};

/**
 * Formats a JS Date as a YYYY-MM-DD string (the shape date inputs and MySQL
 * `date` columns expect).
 */
export const toDateString = (date: Date): string =>
  date.toISOString().split("T")[0];

/**
 * The financial year and period a ledger posting belongs to.
 *
 * Periods are calendar months. `JournalEntries` carries a plain integer beside
 * the year and nothing in the system defines a fiscal calendar offset from the
 * calendar one, so month number is the only honest reading.
 *
 * A posting with no booking date cannot be placed in a period at all, and gets
 * `null` rather than today's — filing an entry into a period it does not belong
 * to is worse than leaving it unfiled, because a period that has been reported
 * would silently change.
 *
 * A `yyyy-mm-dd` string is read as written rather than through `Date`, which
 * would parse it as UTC midnight and then be shifted back a day — and so into
 * the previous period — by any timezone behind UTC.
 */
export const financialPeriodFor = (
  bookingDate: Date | string | null | undefined,
): { financialYear: number; period: number } | null => {
  if (!bookingDate) {
    return null;
  }

  if (typeof bookingDate === "string") {
    const parts = /^(\d{4})-(\d{2})/.exec(bookingDate);
    if (parts) {
      return { financialYear: Number(parts[1]), period: Number(parts[2]) };
    }
  }

  const date = new Date(bookingDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return { financialYear: date.getFullYear(), period: date.getMonth() + 1 };
};

/**
 * Formats the value of a Drizzle `date` column (typed `string | Date`) for
 * display, falling back to `fallback` (an em dash by default) when the value is
 * missing — pass e.g. "Never" or a "N/A" string where that reads better.
 */
export const formatDateValue = (
  value: string | Date | null,
  fallback = "—",
): string => {
  if (!value) {
    return fallback;
  }
  return new Date(value).toLocaleDateString("en-GB");
};

/**
 * A `date` column value shown as it is stored (YYYY-MM-DD): a string passes
 * straight through, a Date is reduced to its ISO date, and a missing value is an
 * em dash. Use this where the raw stored date should be shown as-is rather than
 * localised.
 */
export const formatDateColumn = (value: string | Date | null): string => {
  if (!value) {
    return "—";
  }
  return typeof value === "string" ? value : value.toISOString().slice(0, 10);
};

/**
 * The time-of-day (HH:MM) of a date value, or an em dash when it is missing.
 */
export const formatTimeValue = (value: string | Date | null): string =>
  value
    ? new Date(value).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

/**
 * The calendar year of a date value, or an em dash when it is missing.
 */
export const yearOf = (value: string | Date | null): number | string =>
  value ? new Date(value).getFullYear() : "—";

/**
 * The 1-based month of a date value, or an em dash when it is missing.
 */
export const monthOf = (value: string | Date | null): number | string =>
  value ? new Date(value).getMonth() + 1 : "—";

/**
 * A Date or date-string as the YYYY-MM-DD value a date input expects, or an
 * empty string when there is no value. Uses local calendar parts (never
 * toISOString) so the value round-trips without a timezone shift.
 */
export const toDateInput = (
  value: Date | string | null | undefined,
): string => {
  if (!value) {
    return "";
  }
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * The whole number of days between now and a creation timestamp, floored and
 * never negative — the "days in system" the overviews print.
 */
export const daysInSystem = (createdAt: Date | string): number =>
  Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000),
  );

/**
 * "Yes"/"No" for a boolean; a missing value reads as "No".
 */
export const yesNo = (value: boolean | null | undefined): string =>
  value ? "Yes" : "No";

/**
 * "Yes"/"No" for a boolean, or an em dash when the value is unknown.
 */
export const formatBoolean = (value: boolean | null | undefined): string =>
  value === null || value === undefined ? "—" : value ? "Yes" : "No";

/**
 * A person's full name from its parts, or an em dash when both are missing.
 */
export const fullName = (
  first: string | null | undefined,
  last: string | null | undefined,
): string => {
  const name = [first, last].filter(Boolean).join(" ");
  return name.length > 0 ? name : "—";
};

/**
 * A number with exactly two decimals, thousands separated (no currency symbol).
 */
export const formatFixed2 = (value: number): string =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Stock coverage in months ("3.2 mo"), or an em dash when it can't be computed.
 */
export const formatCoverageMonths = (value: number | null): string =>
  value === null ? "—" : `${value.toFixed(1)} mo`;

/**
 * A table cell value, showing an em dash for a null or empty value.
 */
export const orDash = (value: string | number | null): string | number =>
  value === null || value === "" ? "—" : value;

/**
 * A euro amount in a column of figures, with an em dash where the amount is
 * zero — a page of "€ 0.00" hides the rows that carry a number.
 */
export const formatMoneyOrDash = (value: number): string =>
  value === 0 ? "—" : formatMoney(value);

/**
 * How many days past its term a receivable is, blank while it is still inside
 * the term: "0" would read as due today rather than as not yet due.
 */
export const formatOverdueDays = (days: number | null): string => {
  if (days === null || days <= 0) {
    return "—";
  }
  return String(days);
};

/**
 * A contract as a picklist reads it: its code, what it covers and what kind of
 * contract it is, in one line.
 */
export const contractOptionLabel = (contract: {
  code: string | null;
  description: string | null;
  contractType: ContractType | null;
}): string =>
  [
    contract.code,
    contract.description,
    contract.contractType ? CONTRACT_TYPE_LABELS[contract.contractType] : null,
  ]
    .filter(Boolean)
    .join(" — ");

/**
 * A company as a picklist reads it — the search code staff actually type, then
 * the name. A company with neither falls back to its uuid, so the option can
 * still be told apart from the one below it.
 */
export const companyOptionLabel = (company: {
  searchCode1: string | null;
  companyName: string | null;
  uuid: string;
}): string =>
  [company.searchCode1, company.companyName].filter(Boolean).join(" - ") ||
  company.uuid;

/**
 * A contact as a picklist reads it: their name, or the address they are reached
 * on when the name was never filled in.
 */
export const contactOptionLabel = (contact: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string =>
  [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
  contact.email ||
  "Contact";

/**
 * The roles a company holds that a contract can actually be written against.
 * Anything else it is on file as — a transporter, a purchasing organisation —
 * is not a party to a contract and is dropped.
 */
export const contractableRolesOf = (
  roles: readonly string[] | null | undefined,
): ContractableRole[] =>
  (roles ?? []).filter((role): role is ContractableRole =>
    contractableRoles.includes(role as ContractableRole),
  );

/**
 * Whether a nav href matches the current path — the exact path or a nested
 * child beneath it, never a sibling that merely shares the same prefix (so
 * `/stock` stays distinct from `/stock-movements`).
 */
export const isPathActive = (href: string, pathname: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);

// ---------------------------------------------------------------------------
// Enum-driven business logic
//
// Some enums are more than a picklist — the value chosen determines a computed
// result elsewhere (a due date, a VAT amount, a stock delta). The helpers below
// turn those self-describing enum values into the numbers the rest of the app
// needs, so the logic lives in one place instead of being re-derived (or
// forgotten) at each call site.
// ---------------------------------------------------------------------------

/**
 * The business meaning encoded in a payment term. Every term the ERP offers is
 * self-describing ("within 30 days", "5% prepayment, balance CAD", ...); this
 * turns that into the numbers downstream code needs:
 *   - netDays: days after the invoice date the full balance is due, or `null`
 *     when a due date can't be derived from the invoice date alone (letters of
 *     credit, "against documents", "before shipping", "copy BL", ...).
 *   - endOfMonth: the net period runs to the end of the month it lands in.
 *   - prepaymentPercentage: portion required up front (0 = none, 100 = full).
 *   - discountPercentage / discountDays: early-payment discount and its window.
 *   - creditRestrictionPercentage: the Dutch "kredietbeperking" surcharge —
 *     see DEFAULT_CREDIT_RESTRICTION_PERCENTAGE below.
 */
export type PaymentTermMeta = {
  netDays: number | null;
  endOfMonth: boolean;
  prepaymentPercentage: number;
  discountPercentage: number | null;
  discountDays: number | null;
  creditRestrictionPercentage: number;
};

/**
 * The credit-restriction surcharge applied to terms that actually extend
 * credit. It is added to the invoice and may be deducted again by a customer
 * who settles within the term — a charge for taking time to pay, waived by not
 * taking it.
 *
 * ASSUMPTION, NOT CONFIRMED: the reference system holds this field on both
 * sales and purchase invoices but carries no data to read a rate from, and no
 * maintenance screen for it was available. 2% is the conventional Dutch rate.
 * Change this one constant to correct every term at once.
 */
export const DEFAULT_CREDIT_RESTRICTION_PERCENTAGE = 2;

const netTerm = (
  netDays: number,
  overrides?: Partial<PaymentTermMeta>,
): PaymentTermMeta => ({
  netDays,
  endOfMonth: false,
  prepaymentPercentage: 0,
  discountPercentage: null,
  discountDays: null,
  // Paying now costs nothing extra; taking credit does. Terms settled on the
  // invoice date (cash, prepayment) therefore carry no surcharge.
  creditRestrictionPercentage:
    netDays > 0 ? DEFAULT_CREDIT_RESTRICTION_PERCENTAGE : 0,
  ...overrides,
});

// Terms whose due date can't be pinned to the invoice date (L/C, against
// documents, before shipping, copy BL, after arrival...). netDays stays null.
const openTerm = (
  prepaymentPercentage = 0,
  overrides?: Partial<PaymentTermMeta>,
): PaymentTermMeta => ({
  netDays: null,
  endOfMonth: false,
  prepaymentPercentage,
  discountPercentage: null,
  discountDays: null,
  // No derivable due date means no window to waive the surcharge against, so
  // these terms don't carry one.
  creditRestrictionPercentage: 0,
  ...overrides,
});

export const PAYMENT_TERM_META: Record<InvoicePaymentTerm, PaymentTermMeta> = {
  prepayment: netTerm(0, { prepaymentPercentage: 100 }),
  cash: netTerm(0),
  within_7_days_after_invoice_date: netTerm(7),
  within_8_days_from_date_of_invoice: netTerm(8),
  within_10_days_from_date_of_invoice: netTerm(10),
  within_14_days_from_date_of_invoice: netTerm(14),
  within_21_days_after_invoice_date: netTerm(21),
  within_30_days_from_date_of_invoice: netTerm(30),
  within_30_days_end_of_month: netTerm(30, { endOfMonth: true }),
  within_45_days_from_date_of_invoice: netTerm(45),
  within_60_days_from_date_of_invoice: netTerm(60),
  within_90_days_after_invoice_date: netTerm(90),
  prepayment_minus1pct_discount: netTerm(0, {
    prepaymentPercentage: 100,
    discountPercentage: 1,
    discountDays: 0,
  }),
  within_8_days_minus1pct_30_days_net: netTerm(30, {
    discountPercentage: 1,
    discountDays: 8,
  }),
  within_8_days_minus1_5pct_30_days_net: netTerm(30, {
    discountPercentage: 1.5,
    discountDays: 8,
  }),
  within_8_days_minus2pct_30_days_net: netTerm(30, {
    discountPercentage: 2,
    discountDays: 8,
  }),
  "5pct_prepayment_balance_cad": openTerm(5),
  "10pct_prepayment_balance_cad": openTerm(10),
  "15pct_prepayment_balance_cad": openTerm(15),
  "20pct_prepayment_balance_cad": openTerm(20),
  "25pct_prepayment_balance_cad": openTerm(25),
  "30pct_prepayment_balance_cad": openTerm(30),
  "50pct_prepayment_balance_cad": openTerm(50),
  cash_against_documents: openTerm(),
  lc_at_sight: openTerm(),
  within_10_days_1_5pct_30_days_net: netTerm(30, {
    discountPercentage: 1.5,
    discountDays: 10,
  }),
  within_14_days_minus2pct_30_days_net: netTerm(30, {
    discountPercentage: 2,
    discountDays: 14,
  }),
  within_10_days_minus1pct_30_days_net: netTerm(30, {
    discountPercentage: 1,
    discountDays: 10,
  }),
  within_14_days_minus1pct_30_days_net: netTerm(30, {
    discountPercentage: 1,
    discountDays: 14,
  }),
  within_14_days_minus3pct_30_days_net: netTerm(30, {
    discountPercentage: 3,
    discountDays: 14,
  }),
  within_10_days_minus3pct_30_days_net: netTerm(30, {
    discountPercentage: 3,
    discountDays: 10,
  }),
  lc_120_days: openTerm(),
  "20pct_prepayment_rest_before_shipping": openTerm(20),
  "25pct_prepayment_rest_before_shipping": openTerm(25),
  "20pct_advance_payment_remainder_copy_bl": openTerm(20),
  "30pct_advance_payment_remainder_copy_bl": openTerm(30),
  "5pct_prepayment_balance_30_days_copy_bl": openTerm(5),
  "50pct_in_advance_remainder_14_days_after_arrival_at_port": openTerm(50),
  "5pct_prepayment_balance_60_days_copy_bl": openTerm(5),
  "50pct_prepayment_remaining_15_days_after_shipment": openTerm(50),
  prepayment_minus2pct_discount: netTerm(0, {
    prepaymentPercentage: 100,
    discountPercentage: 2,
    discountDays: 0,
  }),
  lc_180_days: openTerm(),
  lc_90_days: openTerm(),
  to_be_determined: openTerm(),
  immediately_after_receipt_of_goods: netTerm(0),
  payment_in_settlement: openTerm(),
  direct_debit: netTerm(0),
};

/**
 * The invoice due date implied by a payment term, as a YYYY-MM-DD string.
 * Returns `null` when the term doesn't pin a date to the invoice date, or when
 * no invoice date is supplied — callers keep whatever date is already set.
 */
export const getPaymentTermDueDate = (
  term: InvoicePaymentTerm | null | undefined,
  invoiceDate: string | null | undefined,
): string | null => {
  if (!term || !invoiceDate) {
    return null;
  }
  const meta = PAYMENT_TERM_META[term];
  if (meta.netDays === null) {
    return null;
  }
  const base = new Date(`${invoiceDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) {
    return null;
  }
  base.setUTCDate(base.getUTCDate() + meta.netDays);
  if (meta.endOfMonth) {
    // Roll to the last day of the month the net period lands in.
    base.setUTCMonth(base.getUTCMonth() + 1, 0);
  }
  return base.toISOString().split("T")[0];
};

/**
 * The early-payment discount a term grants, or `null` if it grants none.
 */
export const getPaymentTermDiscount = (
  term: InvoicePaymentTerm | null | undefined,
): { percentage: number; withinDays: number } | null => {
  if (!term) {
    return null;
  }
  const meta = PAYMENT_TERM_META[term];
  if (meta.discountPercentage === null || meta.discountDays === null) {
    return null;
  }
  return { percentage: meta.discountPercentage, withinDays: meta.discountDays };
};

/**
 * The credit-restriction surcharge a term carries (0 when it carries none).
 */
export const getCreditRestrictionPercentage = (
  term: InvoicePaymentTerm | null | undefined,
): number => (term ? PAYMENT_TERM_META[term].creditRestrictionPercentage : 0);

/**
 * The surcharge to add to an invoice for the credit its term extends,
 * calculated on the net amount.
 */
export const creditRestrictionOn = (
  term: InvoicePaymentTerm | null | undefined,
  netAmount: number,
): number =>
  netAmount <= 0 ? 0 : netAmount * (getCreditRestrictionPercentage(term) / 100);

/**
 * How much of the credit restriction a payer may keep back.
 *
 * The surcharge is charged for taking time to pay, so settling inside the term
 * earns it back in full; paying after the due date means bearing it. Like the
 * early-payment discount this is a deadline rather than a sliding scale.
 *
 * Terms with no derivable due date (letters of credit, "against documents")
 * carry no surcharge in the first place, so there is nothing to waive.
 */
export const allowedCreditRestrictionDeduction = ({
  term,
  invoiceDate,
  paymentDate,
  creditRestriction,
}: {
  term: InvoicePaymentTerm | null | undefined;
  invoiceDate: string | null | undefined;
  paymentDate: string | null | undefined;
  creditRestriction: number;
}): number => {
  if (creditRestriction <= 0 || !invoiceDate || !paymentDate) {
    return 0;
  }

  const dueDate = getPaymentTermDueDate(term, invoiceDate);
  if (!dueDate) {
    return 0;
  }

  return paymentDate.slice(0, 10) <= dueDate ? creditRestriction : 0;
};

// ---------------------------------------------------------------------------
// Billing part of a line
//
// An order line can be invoiced in instalments, so every money figure on it has
// to be divisible without leaking a cent. The naive way — round(total × share)
// each time — does leak: three slices of a € 100.00 line at a third each round
// to € 33.33 and lose a penny that never appears on any invoice and never comes
// off the holding account.
//
// So a slice is measured as the *movement in the cumulative total*: what should
// have been billed after this instalment, less what should have been billed
// before it. The last slice therefore lands on exactly the line total, whatever
// the rounding did to the ones before it.
// ---------------------------------------------------------------------------

export type LineSlice = {
  /** The order line's full quantity. */
  quantity: number;
  /** How much of that quantity has already been billed. */
  alreadyBilled: number;
  /** How much is being billed now. */
  billing: number;
};

/**
 * The share of a line-level amount that belongs to the quantity being billed.
 *
 * Exact by construction: for any sequence of instalments that adds up to the
 * line quantity, the slices add up to `total` rounded to `decimals` — no
 * accumulated drift, no final-cent fudge.
 */
export const proRataSlice = (
  total: number,
  { quantity, alreadyBilled, billing }: LineSlice,
  decimals = 2,
): number => {
  const factor = 10 ** decimals;
  const roundTo = (value: number) => Math.round(value * factor) / factor;

  if (billing <= 0) {
    return 0;
  }
  // A line with no quantity can't be apportioned; billing it at all bills the
  // whole of whatever it carries. This is the surcharge-shaped case — value
  // with nothing to divide it by.
  if (quantity <= 0) {
    return roundTo(total);
  }

  const before = roundTo((total * alreadyBilled) / quantity);
  const after = roundTo((total * (alreadyBilled + billing)) / quantity);
  return roundTo(after - before);
};

export type OrderLineAmounts = {
  amount: number;
  costAmount: number;
  weightKg: number;
  profit: number;
  profitReplPrice: number;
};

/**
 * An order line's money, cut down to the quantity being billed now.
 *
 * Per-unit figures — net price, cost price, replacement price, margin
 * percentage — are deliberately absent: they don't scale with quantity, so a
 * slice carries them unchanged. Only the extended amounts are divided.
 */
export const sliceOrderLineAmounts = (
  amounts: OrderLineAmounts,
  slice: LineSlice,
): OrderLineAmounts => ({
  amount: proRataSlice(amounts.amount, slice),
  costAmount: proRataSlice(amounts.costAmount, slice),
  weightKg: proRataSlice(amounts.weightKg, slice),
  profit: proRataSlice(amounts.profit, slice),
  profitReplPrice: proRataSlice(amounts.profitReplPrice, slice),
});

/**
 * How much of an order line is still to be billed.
 *
 * Clamped at zero rather than allowed to go negative: a line that has somehow
 * been over-billed offers nothing further, and reporting a negative remainder
 * would have the invoice screen offer to bill a negative quantity.
 */
export const remainingToInvoice = (
  quantity: string | number | null | undefined,
  invoicedQuantity: string | number | null | undefined,
): number => Math.max(0, Number(quantity ?? 0) - Number(invoicedQuantity ?? 0));

/**
 * Quantities are held to three decimals, so anything under half a thousandth is
 * the residue of dividing a line rather than a quantity anybody meant. Used to
 * decide "this line is now fully billed" without demanding exact equality of
 * two decimal strings.
 */
export const QUANTITY_EPSILON = 0.0005;

// ---------------------------------------------------------------------------
// Ageing
//
// A receivable's age is the distance from the day it fell due to today — not
// from the invoice date. Two invoices raised the same morning on 8-day and
// 60-day terms are not equally late, and only the due date knows that.
//
// Everything here is deliberately date-string arithmetic on whole days. An
// ageing report is read as "this debt is 34 days late", never to the hour, and
// working in UTC days keeps a report run at 09:00 and one run at 23:00 in the
// same bucket.
// ---------------------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole days between two YYYY-MM-DD dates, negative when `from` is later. */
const daysBetween = (from: string, to: string): number | null => {
  const start = Date.parse(`${from.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${to.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }
  return Math.round((end - start) / MS_PER_DAY);
};

/**
 * How many days past its due date a receivable is. Zero on the due date itself
 * — the debtor has all of that day to pay — and negative while it is still
 * inside the term, which is how the caller tells "not due" from "due today".
 *
 * `null` when there is no due date to measure from. An invoice on a letter of
 * credit or "against documents" has no derivable due date, and inventing one
 * would report a debt as overdue on a deadline nobody agreed to.
 */
export const daysOverdue = (
  dueDate: string | Date | null | undefined,
  asOf: string = todayDateString(),
): number | null => {
  if (!dueDate) {
    return null;
  }
  const due =
    dueDate instanceof Date ? dueDate.toISOString().slice(0, 10) : dueDate;
  return daysBetween(due, asOf);
};

/**
 * Which ageing bucket a receivable falls in.
 *
 * An invoice with no due date is reported as `not_due` rather than dropped:
 * the money is still owed and has to appear in the total, but calling it late
 * would be asserting a deadline the document never carried.
 */
export const ageingBucketFor = (
  dueDate: string | Date | null | undefined,
  asOf: string = todayDateString(),
): AgeingBucket => {
  const overdue = daysOverdue(dueDate, asOf);
  if (overdue === null || overdue <= 0) {
    return "not_due";
  }
  if (overdue <= 30) {
    return "days_1_30";
  }
  if (overdue <= 60) {
    return "days_31_60";
  }
  if (overdue <= 90) {
    return "days_61_90";
  }
  return "days_over_90";
};

export type AgeingTotals = Record<AgeingBucket, number> & { total: number };

/**
 * Adds a set of open balances up per bucket.
 *
 * Credit notes carry a negative outstanding and are bucketed like anything
 * else, so a credit sitting against an overdue invoice reduces the bucket it
 * belongs to instead of flattering the total. That means a bucket can legally
 * come out negative — a customer owed more than they owe.
 */
export const summariseAgeing = (
  items: { dueDate: string | Date | null | undefined; outstanding: number }[],
  asOf: string = todayDateString(),
): AgeingTotals => {
  const empty = ageingBuckets.reduce(
    (acc, bucket) => ({ ...acc, [bucket]: 0 }),
    {} as Record<AgeingBucket, number>,
  );

  return items.reduce<AgeingTotals>(
    (totals, item) => {
      const bucket = ageingBucketFor(item.dueDate, asOf);
      return {
        ...totals,
        [bucket]: totals[bucket] + item.outstanding,
        total: totals.total + item.outstanding,
      };
    },
    { ...empty, total: 0 },
  );
};

// ---------------------------------------------------------------------------
// Payment reminders
// ---------------------------------------------------------------------------

/**
 * How overdue an invoice must be before each stage of chasing is warranted.
 *
 * POLICY, NOT CONFIRMED: the reference system holds a per-debtor "reminder"
 * flag but exposed no schedule to read these numbers from. 14 / 28 / 42 days is
 * the conventional Dutch cadence — a reminder a fortnight after the term, a
 * second a fortnight later, then a final notice before it goes to collection.
 * Change these three numbers to change the policy everywhere.
 */
export const REMINDER_STAGE_AFTER_DAYS: Record<ReminderStage, number> = {
  first: 14,
  second: 28,
  final: 42,
};

/**
 * One line describing a finished reminder run, built only from what actually
 * happened — a count of zero is left out rather than reported as "0 failed".
 *
 * Null while the run has not succeeded: there is nothing to describe yet, and
 * the error is reported on its own.
 */
export const describeReminderRun = (run: {
  success?: boolean;
  sent?: number;
  unaddressed?: number;
  failed?: number;
  skipped?: number;
}): string | null => {
  if (!run.success) {
    return null;
  }
  const parts = [
    run.sent ? `${run.sent} sent` : null,
    run.unaddressed ? `${run.unaddressed} with no address on file` : null,
    run.failed ? `${run.failed} could not be delivered` : null,
    run.skipped ? `${run.skipped} no longer due` : null,
  ].filter((part): part is string => part !== null);

  return parts.length > 0 ? `${parts.join(", ")}.` : "Nothing was due.";
};

/** The stage after a given one, or `null` when a final notice has been sent. */
export const nextReminderStage = (
  sent: ReminderStage | null | undefined,
): ReminderStage | null => {
  if (!sent) {
    return "first";
  }
  const next = reminderStages[reminderStages.indexOf(sent) + 1];
  return next ?? null;
};

export type ReminderAssessment = {
  /** The stage that should go out now, or `null` if none should. */
  stage: ReminderStage | null;
  /** Why nothing is being sent, for the screen to show instead of a button. */
  reason: string | null;
};

/**
 * Whether an invoice is due a reminder, and which one.
 *
 * The rules, in the order they bite:
 *   - Nothing is chased that isn't owed. A settled invoice, and a credit note
 *     (which owes the customer money), are never chased.
 *   - A debtor with reminders switched off is never chased, whatever the age.
 *     That flag exists to stop letters going to a customer being handled by
 *     hand — a payment plan, a dispute, a receiver.
 *   - An invoice with no derivable due date is not chased automatically. There
 *     is no deadline to say it was missed by.
 *   - The next stage goes out only once its own threshold is passed, so an
 *     invoice 60 days late that has had nothing sent gets a first reminder, not
 *     a final notice. Escalation is a sequence of letters, not a lookup.
 */
export const assessReminder = ({
  outstanding,
  dueDate,
  documentType,
  remindersEnabled,
  lastStageSent,
  asOf = todayDateString(),
}: {
  outstanding: number;
  dueDate: string | Date | null | undefined;
  documentType: InvoiceDocumentType;
  remindersEnabled: boolean;
  lastStageSent: ReminderStage | null | undefined;
  asOf?: string;
}): ReminderAssessment => {
  if (documentType === "credit_note") {
    return { stage: null, reason: "A credit note is owed to the customer." };
  }
  if (outstanding <= 0) {
    return { stage: null, reason: "Nothing outstanding." };
  }
  if (!remindersEnabled) {
    return {
      stage: null,
      reason: "Reminders are switched off for this debtor.",
    };
  }

  const overdue = daysOverdue(dueDate, asOf);
  if (overdue === null) {
    return { stage: null, reason: "No due date to measure against." };
  }
  if (overdue <= 0) {
    return { stage: null, reason: "Not due yet." };
  }

  const stage = nextReminderStage(lastStageSent);
  if (!stage) {
    return { stage: null, reason: "A final notice has already been sent." };
  }
  if (overdue < REMINDER_STAGE_AFTER_DAYS[stage]) {
    return {
      stage: null,
      reason: `${overdue} day${overdue === 1 ? "" : "s"} overdue — the next reminder is due at ${REMINDER_STAGE_AFTER_DAYS[stage]}.`,
    };
  }

  return { stage, reason: null };
};

export type CreditAssessmentInput = {
  /** The debtor's agreed limit. 0 or absent means no limit has been set. */
  creditLimit: number;
  /** What the customer already owes on invoices that still stand. */
  openReceivables: number;
  /**
   * Orders taken but not yet invoiced. These are receivables in waiting: the
   * goods are promised, so the exposure is real even though no invoice exists
   * yet. Excludes the order being assessed, which is counted separately.
   */
  committedOrders?: number;
  /** Gross value of the order being placed — what it will become owed. */
  orderAmount: number;
  /** The order's payment term; some terms extend no credit at all. */
  paymentTerms: InvoicePaymentTerm | null | undefined;
  /** The company has been stopped by hand, whatever its balance says. */
  companyBlocked: boolean;
};

export type CreditAssessment = {
  blocked: boolean;
  /** Why it was held, short enough for `Orders.blockingReason` (varchar 255). */
  reason: string | null;
  creditLimit: number;
  openReceivables: number;
  committedOrders: number;
  /** Room left before the limit is reached; negative once it is exceeded. */
  creditSpace: number;
  /** Everything owed and promised, including this order. */
  exposure: number;
};

/**
 * Whether a payment term actually lends the customer money. A term settled on
 * the invoice date — cash, or full prepayment — extends no credit, so the
 * debtor's limit has no bearing on an order placed under it: the goods are paid
 * for before they go anywhere.
 *
 * Everything else does extend credit, including terms whose due date can't be
 * derived (letters of credit, "against documents"). An unknown term is treated
 * as extending credit, because the safe assumption is the one that checks.
 */
export const paymentTermExtendsCredit = (
  term: InvoicePaymentTerm | null | undefined,
): boolean => {
  if (!term) {
    return true;
  }
  const meta = PAYMENT_TERM_META[term];
  return !(meta.netDays === 0 || meta.prepaymentPercentage === 100);
};

/**
 * What a committed order will actually be worth as a receivable.
 *
 * Exposure has to be measured in one currency of value. Receivables are gross
 * (`Invoices.outstanding` carries VAT) and the order being placed is already
 * weighed gross (`Orders.totalInclVat`), but order *lines* are stored net — so
 * summing them raw understates every uninvoiced order by its VAT. At the
 * standard rate that hands a debtor about a fifth of their limit again in credit
 * space that does not exist, and the shortfall only appears when the invoice
 * lands, which reads as the customer consuming limit for no reason.
 *
 * The rate is the one the order's own summary applied — the customer's
 * `calculateVat` flag — not the eventual invoice's VAT scenario. This is a
 * forecast of an invoice that does not exist yet, and its job is to agree with
 * the figure `createOrder` weighs against the limit.
 */
export const grossUpCommittedOrderValue = (
  netAmount: number,
  companyCalculatesVat: boolean | null | undefined,
): number =>
  netAmount * (1 + getQuoteVatRatePercent(true, companyCalculatesVat) / 100);

/**
 * Decides whether an order should be held for credit reasons.
 *
 * The exposure being tested is what the customer would owe once this order is
 * invoiced: everything outstanding today, plus this order's gross value. That
 * is compared against the limit recorded on the debtor.
 *
 * Two deliberate refusals to block:
 *   - A debtor with no limit recorded (0 or blank) is not blocked. A blank
 *     field means "nobody has set one", not "this customer may owe nothing" —
 *     reading it the other way would hold every order in the system.
 *   - An order paid for up front is not blocked however much is outstanding,
 *     because it adds nothing to what the customer owes.
 *
 * A company stopped by hand is blocked regardless of either, since that flag
 * exists precisely to override the arithmetic.
 */
export const assessCredit = ({
  creditLimit,
  openReceivables,
  committedOrders = 0,
  orderAmount,
  paymentTerms,
  companyBlocked,
}: CreditAssessmentInput): CreditAssessment => {
  const extendsCredit = paymentTermExtendsCredit(paymentTerms);
  const owed = openReceivables + committedOrders;
  const exposure = owed + (extendsCredit ? orderAmount : 0);
  const standing = {
    creditLimit,
    openReceivables,
    committedOrders,
    // Room left before the limit, counting what is promised as well as what is
    // billed — an order taken is a receivable waiting to happen.
    creditSpace: creditLimit - owed,
    exposure,
  };

  if (companyBlocked) {
    return {
      ...standing,
      blocked: true,
      reason: "Customer is blocked",
    };
  }

  if (!extendsCredit || creditLimit <= 0 || exposure <= creditLimit) {
    return { ...standing, blocked: false, reason: null };
  }

  return {
    ...standing,
    blocked: true,
    reason: `Credit limit exceeded — ${formatMoney(owed)} owed and on order plus ${formatMoney(orderAmount)} on this one against a ${formatMoney(creditLimit)} limit`,
  };
};

export type EarlyPaymentDiscountInput = {
  term: InvoicePaymentTerm | null | undefined;
  /** Invoice date, `yyyy-mm-dd`. */
  invoiceDate: string | null | undefined;
  /** When the money actually arrived, `yyyy-mm-dd`. */
  paymentDate: string | null | undefined;
  /** The net (excl. VAT) amount the discount is calculated on. */
  baseAmount: number;
};

/**
 * What a customer is entitled to deduct for paying early, or 0 when nothing is
 * due — the term grants no discount, or the money arrived after the window
 * closed.
 *
 * The discount is calculated on the net amount rather than the gross: the VAT
 * belongs to the tax authority either way, so discounting it would be giving
 * away money that was never the seller's to give.
 *
 * Paying late does not partially earn it. The window is a deadline, so this
 * returns either the whole discount or nothing.
 */
export const allowedEarlyPaymentDiscount = ({
  term,
  invoiceDate,
  paymentDate,
  baseAmount,
}: EarlyPaymentDiscountInput): number => {
  const discount = getPaymentTermDiscount(term);
  if (!discount || !invoiceDate || !paymentDate || baseAmount <= 0) {
    return 0;
  }

  const invoiced = new Date(`${invoiceDate.slice(0, 10)}T00:00:00Z`);
  const paid = new Date(`${paymentDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(invoiced.getTime()) || Number.isNaN(paid.getTime())) {
    return 0;
  }

  const deadline = new Date(invoiced);
  deadline.setUTCDate(deadline.getUTCDate() + discount.withinDays);

  if (paid.getTime() > deadline.getTime()) {
    return 0;
  }

  return baseAmount * (discount.percentage / 100);
};

/**
 * The portion of the invoice a term requires up front (0 when none).
 */
export const getPaymentTermPrepaymentPercentage = (
  term: InvoicePaymentTerm | null | undefined,
): number => (term ? PAYMENT_TERM_META[term].prepaymentPercentage : 0);

export const VAT_CODE_RATE: Record<VatCode, number> = {
  vat_0: 0,
  vat_low_9: 9,
  vat_high_21: 21,
  vat_middle_12: 12,
};

/**
 * The VAT rate (as a percentage) a VAT code represents.
 */
export const getVatRatePercent = (code: VatCode | null | undefined): number =>
  code ? VAT_CODE_RATE[code] : 0;

/**
 * Reverse-charge scenarios move the VAT liability to the counterparty, so the
 * document itself charges 0% VAT.
 */
export const isReverseChargeScenario = (
  scenario: InvoiceVatScenario | null | undefined,
): boolean =>
  scenario === "domestic_purchase_vat_shifted" ||
  scenario === "purchase_within_eu_with_reverse_charge" ||
  scenario === "purchase_outside_eu_with_reverse_charge" ||
  scenario === "sales_within_eu_with_reverse_charge" ||
  scenario === "sales_outside_eu_with_reverse_charge";

/**
 * Whether an invoice under this VAT scenario charges VAT at all. Everything
 * that isn't a reverse charge charges VAT (a missing scenario defaults to
 * charging, matching the standard domestic case).
 */
export const invoiceChargesVat = (
  scenario: InvoiceVatScenario | null | undefined,
): boolean => !isReverseChargeScenario(scenario);

// Standard Dutch VAT rate applied to a sales invoice that charges VAT. The
// invoice header carries a scenario, not a per-line VAT code, so the high rate
// is the applicable one; reverse-charge scenarios drop it to 0.
const STANDARD_INVOICE_VAT_RATE = VAT_CODE_RATE.vat_high_21;

/**
 * The VAT rate (percentage) to apply to a sales invoice for a given scenario:
 * the standard rate when VAT is charged, 0 for reverse-charge scenarios.
 */
export const getInvoiceVatRatePercent = (
  scenario: InvoiceVatScenario | null | undefined,
): number => (invoiceChargesVat(scenario) ? STANDARD_INVOICE_VAT_RATE : 0);

/**
 * The VAT rate (percentage) a quote's summary should apply. VAT is only charged
 * when the quote asks for it *and* the customer is one that VAT is calculated
 * for — a VAT-exempt customer never gets VAT on a quote that ticks the box.
 */
export const getQuoteVatRatePercent = (
  calculateVatIfApplicable: boolean | null | undefined,
  companyCalculatesVat: boolean | null | undefined,
): number =>
  calculateVatIfApplicable && companyCalculatesVat !== false
    ? STANDARD_INVOICE_VAT_RATE
    : 0;

/**
 * Running metres a line represents — the "M1" column on the purchase screens.
 *
 * Derived rather than stored, because it is never independent information: for
 * goods sold by the metre the quantity already is the length, and for goods
 * sold by the piece it is the pieces times how long each one is. Storing it
 * would create a second number that could disagree with the first.
 *
 * Returns 0 when the length is unknown, rather than inventing one.
 */
export const runningMeters = ({
  quantity,
  unit,
  lengthMm,
}: {
  quantity: number;
  unit: StockUnit | null | undefined;
  lengthMm: number | null | undefined;
}): number => {
  // "m1" is the unit code for running metres, so such a line already counts in
  // them and must not be multiplied by its own length again.
  if (unit === "m1") {
    return quantity;
  }
  if (!lengthMm) {
    return 0;
  }
  return (quantity * lengthMm) / 1000;
};

/**
 * Whether a complaint's agreed solution involves the goods physically coming
 * back. Only these justify a return order: a price correction or a rejected
 * complaint settles on paper, and a subsequent delivery sends more out rather
 * than bringing anything in.
 */
export const complaintSolutionReturnsGoods = (
  solution: ComplaintSolution | null | undefined,
): boolean =>
  solution === "collect_goods_back_credit" ||
  solution === "return_goods_credit_redeliver";

/**
 * The return reason a complaint category implies. The two vocabularies were
 * written for different screens and only partly overlap, so anything without a
 * clear counterpart lands on "other" rather than being forced into a reason
 * that would misreport why the goods came back.
 */
export const returnReasonForComplaintCategory = (
  category: ComplaintCategory | null | undefined,
): ReturnOrderReason => {
  switch (category) {
    case "damaged":
    case "transport_damage":
      return "damaged_goods";
    case "wrong_material_delivered":
    case "incorrect_delivery_address":
      return "wrong_delivery";
    case "wrong_quantity":
      return "excess_delivery";
    default:
      return "other";
  }
};

/**
 * How a sales document identifies itself: `INV-1042`, or `CRN-1043` when it is
 * a credit note. Shared by the overview, the detail screen and the email so a
 * customer quoting a number back at you finds the same document on screen.
 */
export const invoiceReference = (
  documentType: InvoiceDocumentType | null | undefined,
  id: number | null | undefined,
): string => `${documentType === "credit_note" ? "CRN" : "INV"}-${id ?? "?"}`;

export type PurchaseInvoiceLineAmount = {
  /** Net amount booked on the line. */
  amount: number;
  /** The VAT code the line was booked under, snapshotted from the product. */
  vatCode: VatCode | null;
};

export type PurchaseInvoiceSummaryInput = {
  lines: PurchaseInvoiceLineAmount[];
  surcharges: number[];
  optionsAmount?: number;
  /** The supplier's kredietbeperking — the one figure a clerk types. */
  creditRestriction: number;
  /**
   * The total printed on the supplier's document, also typed. Everything else
   * is derived, so this is what the derivation is reconciled against.
   */
  invoiceTotal: number;
};

export type PurchaseInvoiceSummary = {
  materials: number;
  optionsAmount: number;
  surcharges: number;
  totalExclVat: number;
  vatHigh: number;
  vatMiddle: number;
  vatLow: number;
  vatTotal: number;
  totalInclVat: number;
  creditRestriction: number;
  /** What the supplier billed that the booked lines don't account for. */
  remainder: number;
  /** The build-up's bottom line, which reconciles to the supplier's total. */
  totalGeneral: number;
};

/**
 * The accounting summary of a purchase invoice.
 *
 * Only two figures on this document are typed: the total printed on the
 * supplier's paperwork, and the credit restriction they applied. Everything
 * else is derived from the lines received and the surcharges booked — a clerk
 * keying the materials total by hand is a clerk who can key it wrong, and the
 * ledger would believe them.
 *
 * VAT splits into the three bands the document reports, taken from each line's
 * own VAT code rather than one rate for the whole invoice: a pallet of goods at
 * 21% and a delivery at 9% belong in different boxes on the return. Surcharges
 * follow the high rate, being services.
 *
 * `remainder` is the reconciliation: the difference between what the supplier
 * billed and what the booked lines, surcharges, VAT and credit restriction add
 * up to. Zero means the booking matches the paperwork. Anything else is the
 * amount someone still has to explain — which is precisely why it is shown
 * rather than quietly absorbed into a total.
 */
export const summarisePurchaseInvoice = ({
  lines,
  surcharges,
  optionsAmount = 0,
  creditRestriction,
  invoiceTotal,
}: PurchaseInvoiceSummaryInput): PurchaseInvoiceSummary => {
  const materials = lines.reduce((sum, line) => sum + line.amount, 0);
  const surchargeTotal = surcharges.reduce((sum, amount) => sum + amount, 0);
  const totalExclVat = materials + optionsAmount + surchargeTotal;

  const vatOn = (code: VatCode): number =>
    lines
      .filter((line) => line.vatCode === code)
      .reduce(
        (sum, line) => sum + line.amount * (VAT_CODE_RATE[code] / 100),
        0,
      );

  // Services follow the standard rate, so surcharges land in the high band.
  const vatHigh =
    vatOn("vat_high_21") + surchargeTotal * (VAT_CODE_RATE.vat_high_21 / 100);
  const vatMiddle = vatOn("vat_middle_12");
  const vatLow = vatOn("vat_low_9");
  const vatTotal = vatHigh + vatMiddle + vatLow;
  const totalInclVat = totalExclVat + vatTotal;

  // With no supplier total to reconcile against there is nothing unexplained;
  // the build-up stands on its own.
  const accounted = totalInclVat + creditRestriction;
  const remainder = invoiceTotal === 0 ? 0 : invoiceTotal - accounted;

  return {
    materials,
    optionsAmount,
    surcharges: surchargeTotal,
    totalExclVat,
    vatHigh,
    vatMiddle,
    vatLow,
    vatTotal,
    totalInclVat,
    creditRestriction,
    remainder,
    totalGeneral: accounted + remainder,
  };
};

/**
 * The direction a stock movement pushes the on-hand quantity: `in` adds, `out`
 * removes.
 */
export const getStockMovementSign = (type: StockMovementType): 1 | -1 =>
  type === "in" ? 1 : -1;

/**
 * Applies a stock movement of the given type to a quantity, returning the
 * signed delta (positive for `in`, negative for `out`).
 */
export const applyStockMovementDelta = (
  quantity: number,
  type: StockMovementType,
): number => quantity * getStockMovementSign(type);

/**
 * The commercial responsibilities an Incoterm (delivery term) assigns between
 * seller and buyer, per Incoterms 2020. Used to answer "who arranges/pays the
 * carriage, who insures, who clears customs, and where does risk pass?".
 */
export type IncotermMeta = {
  /** Seller arranges and pays the main carriage to the destination. */
  sellerArrangesCarriage: boolean;
  /** Seller carries a contractual insurance obligation (only CIF/CIP). */
  sellerInsures: boolean;
  /** Seller handles export clearance (every term except EXW). */
  sellerClearsExport: boolean;
  /** Seller handles import clearance and duties (only DDP). */
  sellerClearsImport: boolean;
  /** The point at which risk passes from seller to buyer. */
  riskTransfer:
    | "sellers_premises"
    | "carrier_handover"
    | "ship_on_board"
    | "named_destination"
    | "buyers_premises";
};

export const INCOTERM_META: Record<DeliveryTerm, IncotermMeta> = {
  exw: {
    sellerArrangesCarriage: false,
    sellerInsures: false,
    sellerClearsExport: false,
    sellerClearsImport: false,
    riskTransfer: "sellers_premises",
  },
  fca: {
    sellerArrangesCarriage: false,
    sellerInsures: false,
    sellerClearsExport: true,
    sellerClearsImport: false,
    riskTransfer: "carrier_handover",
  },
  fob: {
    sellerArrangesCarriage: false,
    sellerInsures: false,
    sellerClearsExport: true,
    sellerClearsImport: false,
    riskTransfer: "ship_on_board",
  },
  cfr: {
    sellerArrangesCarriage: true,
    sellerInsures: false,
    sellerClearsExport: true,
    sellerClearsImport: false,
    riskTransfer: "ship_on_board",
  },
  cif: {
    sellerArrangesCarriage: true,
    sellerInsures: true,
    sellerClearsExport: true,
    sellerClearsImport: false,
    riskTransfer: "ship_on_board",
  },
  cpt: {
    sellerArrangesCarriage: true,
    sellerInsures: false,
    sellerClearsExport: true,
    sellerClearsImport: false,
    riskTransfer: "carrier_handover",
  },
  cip: {
    sellerArrangesCarriage: true,
    sellerInsures: true,
    sellerClearsExport: true,
    sellerClearsImport: false,
    riskTransfer: "carrier_handover",
  },
  dap: {
    sellerArrangesCarriage: true,
    sellerInsures: false,
    sellerClearsExport: true,
    sellerClearsImport: false,
    riskTransfer: "named_destination",
  },
  dpu: {
    sellerArrangesCarriage: true,
    sellerInsures: false,
    sellerClearsExport: true,
    sellerClearsImport: false,
    riskTransfer: "named_destination",
  },
  ddp: {
    sellerArrangesCarriage: true,
    sellerInsures: false,
    sellerClearsExport: true,
    sellerClearsImport: true,
    riskTransfer: "buyers_premises",
  },
};

/**
 * The Incoterm responsibilities for a delivery term (null when none is set).
 */
export const getIncotermMeta = (
  term: DeliveryTerm | null | undefined,
): IncotermMeta | null => (term ? INCOTERM_META[term] : null);

/**
 * Adds a lead time expressed in a given unit to a YYYY-MM-DD date, returning
 * the resulting YYYY-MM-DD date. `working_days` skips weekends; `months` rolls
 * the calendar month; `weeks` adds 7-day blocks. Returns null on bad input.
 */
export const addLeadTime = (
  from: string | null | undefined,
  amount: number,
  unit: DeliveryTimeUnit,
): string | null => {
  if (!from || !Number.isFinite(amount)) {
    return null;
  }
  const date = new Date(`${from.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  if (unit === "months") {
    date.setUTCMonth(date.getUTCMonth() + amount);
  } else if (unit === "weeks") {
    date.setUTCDate(date.getUTCDate() + amount * 7);
  } else {
    // working_days: step one calendar day at a time, counting only Mon–Fri.
    const step = Math.trunc(amount) >= 0 ? 1 : -1;
    const stepWorkingDays = (remaining: number): void => {
      if (remaining === 0) {
        return;
      }
      date.setUTCDate(date.getUTCDate() + step);
      const day = date.getUTCDay();
      stepWorkingDays(day !== 0 && day !== 6 ? remaining - step : remaining);
    };
    stepWorkingDays(Math.trunc(amount));
  }
  return date.toISOString().split("T")[0];
};

/**
 * Computes a transport cost from a transporter's price unit and rate:
 *   - amount: a flat charge (the rate itself)
 *   - per_km: rate × distance
 *   - per_kg: rate × weight
 *   - percentage: rate % of the goods value
 * Missing context for the chosen unit yields 0.
 */
export const computeTransportCost = (
  unit: TransporterPriceUnit,
  rate: number,
  context: {
    distanceKm?: number;
    weightKg?: number;
    goodsValue?: number;
  } = {},
): number => {
  if (unit === "amount") {
    return rate;
  }
  if (unit === "per_km") {
    return rate * (context.distanceKm ?? 0);
  }
  if (unit === "per_kg") {
    return rate * (context.weightKg ?? 0);
  }
  return ((context.goodsValue ?? 0) * rate) / 100;
};

/**
 * The minimum stock level implied by a stock mode: a fixed value, or a
 * multiplier applied to average monthly consumption.
 */
export const computeMinimumStock = (
  mode: StockMode,
  value: number,
  averageMonthlyConsumption: number,
): number =>
  mode === "fixed_value" ? value : value * averageMonthlyConsumption;

/**
 * Resolves the lead time to use given the configured method: a manual value, or
 * the automatic maximum/average of observed lead times. Returns null when the
 * needed input is missing.
 */
export const resolveLeadTime = (
  method: LeadTimeMethod,
  context: { manual?: number; maximum?: number; average?: number },
): number | null => {
  if (method === "manually") {
    return context.manual ?? null;
  }
  if (method === "automatic_maximum") {
    return context.maximum ?? null;
  }
  return context.average ?? null;
};

/**
 * Picks the weight to bill against, based on the order's weight type: the
 * theoretical, trade, German trade, or actually-weighed figure. Returns null
 * when the selected basis has no value.
 */
export const resolveOrderWeight = (
  type: OrderWeightType,
  weights: {
    theoretical?: number | null;
    trade?: number | null;
    germanTrade?: number | null;
    weighed?: number | null;
  },
): number | null => {
  if (type === "theoretical_weight") {
    return weights.theoretical ?? null;
  }
  if (type === "trade_weight") {
    return weights.trade ?? null;
  }
  if (type === "german_trade_weight") {
    return weights.germanTrade ?? null;
  }
  return weights.weighed ?? null;
};

/**
 * The order type a quote/order header describes, as the single label the
 * overviews print. The header carries the type as a set of independent flags,
 * so the most specific one that is set wins; a header with none set is a plain
 * "Standard" sale.
 */
export const resolveOrderTypeLabel = (flags: {
  isPickup?: boolean | null;
  isConsignment?: boolean | null;
  isIncidental?: boolean | null;
  isInternalProduction?: boolean | null;
  isCustomerMaterial?: boolean | null;
}): string => {
  if (flags.isConsignment) {
    return "Consignment";
  }
  if (flags.isCustomerMaterial) {
    return "Customer material";
  }
  if (flags.isInternalProduction) {
    return "Internal production";
  }
  if (flags.isIncidental) {
    return "Incidental";
  }
  if (flags.isPickup) {
    return "Pickup";
  }
  return "Standard";
};

/**
 * The net price left after the group and line discounts are taken off a gross
 * price. Discounts stack sequentially — the line discount applies to what the
 * group discount already reduced — which is how the ERP quotes them.
 */
export const applyPriceDiscounts = (
  grossPrice: number,
  groupDiscountPercent: number,
  lineDiscountPercent: number,
): number =>
  grossPrice *
  (1 - groupDiscountPercent / 100) *
  (1 - lineDiscountPercent / 100);

/**
 * A contract's discount tiers, as stored on the contract: each tier gives the
 * percentage that applies from a quantity (or weight, or amount) upwards.
 */
export type DiscountTier = { from: number; percentage: number };

/**
 * The tiers a contract should be priced at, normalised: sorted by their
 * threshold and always starting at 0, so every quantity finds a tier. A
 * contract with no tiers at all prices at a single 0% tier from 0.
 */
export const normaliseDiscountTiers = (
  tiers: DiscountTier[] | null | undefined,
): DiscountTier[] => {
  const sorted = [...(tiers ?? [])]
    .filter((tier) => Number.isFinite(tier.from))
    .sort((a, b) => a.from - b.from);
  if (sorted.length === 0 || sorted[0].from > 0) {
    return [{ from: 0, percentage: 0 }, ...sorted];
  }
  return sorted;
};

/**
 * The discount percentage that applies to a given quantity — the highest tier
 * whose threshold the quantity has reached.
 */
export const resolveTierDiscount = (
  tiers: DiscountTier[] | null | undefined,
  quantity: number,
): number =>
  normaliseDiscountTiers(tiers)
    .filter((tier) => quantity >= tier.from)
    .at(-1)?.percentage ?? 0;

/**
 * Profit margin as a percentage of revenue. Revenue of 0 has no margin to
 * report, so it yields 0 rather than dividing by zero.
 */
export const profitMarginPercent = (revenue: number, profit: number): number =>
  revenue === 0 ? 0 : (profit / revenue) * 100;

/**
 * The Monday of a given ISO week/year, as a YYYY-MM-DD string — used to turn a
 * "delivery in week N" into a concrete date. Returns null on bad input.
 */
export const isoWeekToDate = (
  week: number | null | undefined,
  year: number | null | undefined,
): string | null => {
  if (!week || !year || week < 1 || week > 53) {
    return null;
  }
  // ISO 8601: week 1 is the week containing the first Thursday of the year.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7; // Sunday (0) → 7
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));
  week1Monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return week1Monday.toISOString().split("T")[0];
};

/**
 * Resolves a delivery moment to a concrete YYYY-MM-DD date: for a `date`-type
 * delivery it's the date itself; for a `week`-type it's the Monday of that ISO
 * week. Returns null when the needed inputs are missing.
 */
export const resolveDeliveryDate = (
  type: DeliveryType,
  context: {
    date?: string | null;
    week?: number | null;
    year?: number | null;
  },
): string | null => {
  if (type === "week") {
    return isoWeekToDate(context.week, context.year);
  }
  return context.date ? context.date.slice(0, 10) : null;
};

// ---------------------------------------------------------------------------
// Label lookups
//
// The overviews print an enum value through its human label; each helper looks
// the value up in its label map, falls back to the raw value if the map has no
// entry, and shows an em dash when there is no value at all.
// ---------------------------------------------------------------------------

/** The display label for a sales representative. */
export const salesRepresentativeLabel = (
  value: SalesRepresentative | string | null | undefined,
): string =>
  value
    ? (SALES_REPRESENTATIVE_LABELS[value as SalesRepresentative] ?? value)
    : "—";

/** The display label for a customer group. */
export const customerGroupLabel = (
  value: CustomerGroup | string | null | undefined,
): string =>
  value ? (CUSTOMER_GROUP_LABELS[value as CustomerGroup] ?? value) : "—";

/** The display label for an invoice payment term. */
export const invoicePaymentTermLabel = (
  value: InvoicePaymentTerm | string | null | undefined,
): string =>
  value
    ? (INVOICE_PAYMENT_TERM_LABELS[value as InvoicePaymentTerm] ?? value)
    : "—";

/** The display label for a stock unit, blank when the line carries none. */
export const stockUnitLabel = (value: StockUnit | null | undefined): string =>
  value ? STOCK_UNIT_LABELS[value] : "";

/** The display label for an order line status. */
export const orderLineStatusLabel = (
  value: OrderLineStatus | string | null | undefined,
): string =>
  value ? (ORDER_LINE_STATUS_LABELS[value as OrderLineStatus] ?? value) : "—";

/** The display label for a purchase order status. */
export const purchaseOrderStatusLabel = (
  value: PurchaseOrderStatus | string | null | undefined,
): string =>
  value
    ? (PURCHASE_ORDER_STATUS_LABELS[value as PurchaseOrderStatus] ?? value)
    : "—";

/** The display label for an order deblock type. */
export const orderDeblockTypeLabel = (
  value: OrderDeblockType | string | null | undefined,
): string =>
  value ? (ORDER_DEBLOCK_TYPE_LABELS[value as OrderDeblockType] ?? value) : "—";

/**
 * A goods-flow counterparty as the SFN return classifies it: its federation
 * role plus whether it sits at home or abroad.
 */
export type Counterparty = {
  role: SfnCounterpartyRole;
  domestic: boolean;
};

/**
 * The counterparty behind a company uuid, falling back to a domestic
 * non-member when the uuid is missing or unknown — the default the goods-flow
 * return classifies unrecorded companies under.
 */
export const resolveCounterparty = (
  counterparties: Map<string, Counterparty>,
  uuid: string | null,
): Counterparty =>
  (uuid ? counterparties.get(uuid) : undefined) ?? {
    role: "non_member",
    domestic: true,
  };

/**
 * Clamps a month number into the valid 1–12 calendar range.
 */
export const clampMonth = (month: number): number =>
  Math.min(12, Math.max(1, month));

/**
 * The periods a monthly report covers — currently just the running month of
 * the current year.
 */
export const buildPeriods = (): Array<{ year: number; month: number }> => {
  const now = new Date();
  return [{ year: currentYear(), month: clampMonth(now.getMonth() + 1) }];
};

/**
 * The `year-month` string reports bucket rows by when grouping per period.
 */
export const periodKey = (year: number, month: number): string =>
  `${year}-${month}`;

/**
 * The last `count` calendar months, oldest first, ending with the month that
 * `from` falls in.
 *
 * Each entry carries the key the SQL period rows are matched on, the short
 * label a chart axis shows, and the first day of the month a query filters
 * from. Built from local calendar parts rather than by subtracting days, so a
 * 31st never rolls into the wrong month.
 */
export const recentMonths = (
  count: number,
  from: Date = new Date(),
): Array<{
  key: string;
  label: string;
  year: number;
  month: number;
  start: string;
}> =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date(
      from.getFullYear(),
      from.getMonth() - (count - 1 - index),
      1,
    );
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return {
      key: periodKey(year, month),
      label: date.toLocaleDateString("en-US", { month: "short" }),
      year,
      month,
      start: `${year}-${String(month).padStart(2, "0")}-01`,
    };
  });

/**
 * The number inside a single-row `{ value: COUNT(*) }` select — the shape the
 * app's count queries project — as a plain number, 0 when no row came back.
 */
export const firstCount = (rows: Array<{ value: number }>): number =>
  Number(rows[0]?.value ?? 0);

/**
 * Rounds an advised order quantity up to the supplier's order series, never
 * below the minimum order quantity — the same rounding the ERP applies to
 * "Order Qty". A non-positive advice stays 0; without an order series the
 * quantity is only lifted to the minimum.
 */
export const roundToOrderQty = (
  advice: number,
  orderSeries: number,
  minOrderQty: number,
): number => {
  if (advice <= 0) {
    return 0;
  }
  const target = Math.max(advice, minOrderQty);
  if (orderSeries > 0) {
    return Math.ceil(target / orderSeries) * orderSeries;
  }
  return target;
};

/**
 * One revenue-bearing block of a quote's summary: what it brings in, what it
 * makes against actual cost, and what it makes against today's replacement
 * price. The two profit figures diverge whenever the market has moved since the
 * goods were bought, which is exactly what the reference system's side-by-side
 * "Profit" / "Profit w.r.t. Repl. price" columns exist to show.
 */
export type QuoteSummaryBlock = {
  revenue: number;
  profit: number;
  profitPercent: number;
  profitReplPrice: number;
  profitReplPricePercent: number;
};

/**
 * A material line as the summary reads it. `amount` is the revenue the line
 * brings in; the two costs are line totals, not unit prices.
 */
export type QuoteSummaryLineInput = {
  amount: number;
  costAmount: number;
  replacementCost: number;
  weightKg: number;
  theoreticalWeightKg: number;
};

/** An option line: revenue and its own cost, with no replacement-price basis. */
export type QuoteSummaryOptionInput = {
  amount: number;
  cost: number;
};

/**
 * A surcharge: the amount charged and the profit it carries. Surcharges are
 * quoted at an agreed margin rather than costed per unit, so the profit is
 * given rather than derived.
 */
export type QuoteSummarySurchargeInput = {
  amount: number;
  profit: number;
};

export type QuoteSummaryInput = {
  lines: QuoteSummaryLineInput[];
  options?: QuoteSummaryOptionInput[];
  surcharges?: QuoteSummarySurchargeInput[];
  transportCosts?: number;
  handlingCosts?: number;
  /** VAT percentage to apply to the net total. 0 leaves the quote VAT-free. */
  vatRatePercent?: number;
};

export type QuoteSummary = {
  materials: QuoteSummaryBlock;
  options: QuoteSummaryBlock;
  surcharges: QuoteSummaryBlock;
  transportCosts: number;
  handlingCosts: number;
  total: QuoteSummaryBlock;
  vatAmount: number;
  totalInclVat: number;
  avgKiloPrice: number;
  totalWeightKg: number;
  theoreticalWeightKg: number;
};

/**
 * A stored column as the string a form control holds. NULL and undefined become
 * the fallback (an empty string unless told otherwise), because an input's value
 * must always be a string — handing it null makes React switch the field from
 * controlled to uncontrolled mid-edit.
 *
 * The fallback matters for numeric columns: a decimal field wants "0.00" rather
 * than "", so the box reads as a figure of zero instead of an empty one.
 */
export const toFormString = (
  value: string | number | null | undefined,
  fallback = "",
): string => (value === null || value === undefined ? fallback : String(value));

/**
 * Turns an enum's const array and its label map into the options a `<Select>`
 * takes, with a leading "Empty" entry — almost every dropdown on the document
 * screens treats "unset" as a real choice, so the blank is the default rather
 * than an omission.
 */
export const enumOptions = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
  emptyLabel = "Empty",
): Array<{ value: string; label: string }> => [
  { value: "", label: emptyLabel },
  ...values.map((value) => ({ value, label: labels[value] })),
];

/**
 * What a quote line is worth once its net price is known: the two cost bases,
 * the two profits they produce, the weight and the running metres.
 */
export type QuoteLineFinancialsInput = {
  netPrice: number;
  quantity: number;
  /** Average purchase price per unit. Falls back to the replacement price. */
  purchasePrice: number;
  replacementPrice: number;
  /** Weight of one unit, used for both the line weight and the kilo price. */
  theoreticalWeight: number;
  /** The line's own length in mm, or the product's when the line has none. */
  lengthMm: number;
  /** Margin floor from the product group; 0 disables the too-low flag. */
  minProfitMargin: number;
};

export type QuoteLineFinancials = {
  amount: number;
  purchasePrice: number;
  costPrice: number;
  costAmount: number;
  replacementCost: number;
  profit: number;
  profitMargin: number;
  profitReplPrice: number;
  weightKg: number;
  m1PerPiece: number;
  profitTooLow: boolean;
};

/**
 * Derives everything a quote line reports in money from its net price.
 *
 * The net price itself is resolved elsewhere — on the server from the contract,
 * on the client from the list price for the pre-save preview — but the
 * arithmetic on top of it is the same either way, so both go through here and
 * the preview can never quietly disagree with what gets saved.
 *
 * A product that has never been purchased has no average purchase price, so its
 * replacement price stands in: the goods cost *something*, and pretending
 * otherwise would show the line as pure profit.
 */
export const quoteLineFinancials = ({
  netPrice,
  quantity,
  purchasePrice,
  replacementPrice,
  theoreticalWeight,
  lengthMm,
  minProfitMargin,
}: QuoteLineFinancialsInput): QuoteLineFinancials => {
  const amount = netPrice * quantity;
  const costPrice = purchasePrice > 0 ? purchasePrice : replacementPrice;
  const costAmount = costPrice * quantity;
  const replacementCost = replacementPrice * quantity;
  const profit = amount - costAmount;
  const profitMargin = profitMarginPercent(amount, profit);

  return {
    amount,
    purchasePrice,
    costPrice,
    costAmount,
    replacementCost,
    profit,
    profitMargin,
    profitReplPrice: amount - replacementCost,
    weightKg: quantity * theoreticalWeight,
    m1PerPiece: lengthMm / 1000,
    profitTooLow: minProfitMargin > 0 && profitMargin < minProfitMargin,
  };
};

export type PostingLine = {
  account: string;
  debit: number;
  credit: number;
};

export type PostingBalance = {
  totalDebit: number;
  totalCredit: number;
  /** Debits less credits — zero for a well-formed entry. */
  difference: number;
  balanced: boolean;
};

/**
 * Whether a set of posting lines balances.
 *
 * Double entry has exactly one rule: every entry moves the same total onto the
 * debit side as onto the credit side. It is worth stating as code because it is
 * the only check that catches a whole class of accounting bug at once — a
 * forgotten VAT line, a surcharge posted to no counter-account, a credit note
 * that reverses three lines out of four. None of those are visible in a list of
 * journal rows; all of them show up here immediately.
 *
 * Rounding is allowed a cent, since amounts are decimals rendered to two places
 * and a VAT calculation can legitimately land half a cent out. Anything larger
 * is a missing line, not arithmetic.
 */
export const postingBalance = (lines: PostingLine[]): PostingBalance => {
  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
  const difference = totalDebit - totalCredit;

  return {
    totalDebit,
    totalCredit,
    difference,
    balanced: Math.abs(difference) < 0.005,
  };
};

/**
 * Splits a signed amount onto the correct side of an account.
 *
 * Posting code otherwise repeats `amount > 0 ? ... : ...` at every call site,
 * and a single one of them getting the sign backwards produces an entry that
 * still balances while recording the opposite of what happened — the kind of
 * error a trial balance cannot catch.
 *
 * A negative debit is a credit, and vice versa: reversals and credit notes
 * arrive with negative amounts and must land on the other side rather than as a
 * negative figure on the same one.
 */
export const debitCredit = (
  amount: number,
): { debit: number; credit: number } =>
  amount >= 0 ? { debit: amount, credit: 0 } : { debit: 0, credit: -amount };

export type LotRevaluationInput = {
  /** What the lot held before the material left. */
  previousQuantity: number;
  /** What it holds now. */
  remainingQuantity: number;
  /** The lot's cost per unit, where it has one. */
  unitCost: number;
  /** The total the lot was carried at before. */
  previousValue: number;
};

/**
 * What a stock lot is worth once part of it has left.
 *
 * A lot carries a unit cost *and* a total, so taking material out without
 * restating the total leaves fewer units sitting at the old value — the lot
 * quietly becomes worth more per unit every time it is drawn down, and stock
 * valuation drifts up permanently with nothing on any screen to reveal it.
 *
 * The unit cost is authoritative wherever there is one. Where there is not, the
 * total is scaled by the share that remains, which keeps a drawdown
 * proportional instead of writing the remainder down to nothing.
 */
export const restateLotValue = ({
  previousQuantity,
  remainingQuantity,
  unitCost,
  previousValue,
}: LotRevaluationInput): number => {
  if (remainingQuantity <= 0) {
    return 0;
  }
  if (unitCost > 0) {
    return remainingQuantity * unitCost;
  }
  if (previousQuantity <= 0) {
    return 0;
  }
  return previousValue * (remainingQuantity / previousQuantity);
};

export type ProductionYieldInput = {
  /** Material taken to the machine, out of the lot the order line reserved. */
  consumed: number;
  /** Finished goods the order line will be delivered from. */
  produced: number;
  /** Usable offcut going back to stock as a lot of its own. */
  remnant: number;
  /** What one unit of the input lot is carried at. */
  inputUnitCost: number;
};

export type ProductionYield = {
  /** Material that came out as neither goods nor remnant. */
  waste: number;
  /** True when more came out than went in — impossible, so a caller must refuse. */
  impossible: boolean;
  remnantCost: number;
  producedCost: number;
  producedUnitCost: number;
};

/**
 * Splits the cost of the material a production run consumed across what it
 * produced and what it put back.
 *
 * Sawing a bar destroys the lot it came from: what leaves the machine is
 * customer goods, a usable offcut, and waste. So the quantities have to close —
 *
 *   consumed = produced + remnant + waste
 *
 * — and the money has to close with them, or stock value drifts every run.
 *
 * The remnant is carried at the input's unit cost, because it is the same
 * material in a shorter length and anyone may order it next. Everything else,
 * waste included, lands on the produced goods. That is deliberate: yield loss is
 * a cost of the output that caused it, so a run that wastes half a bar shows the
 * goods costing nearly twice the raw material — which is exactly the signal that
 * makes bad sawing visible in the margin instead of hiding it in stock.
 *
 * Producing more than was consumed is flagged rather than silently absorbed. It
 * means the figures are wrong, and inventing material to reconcile them is how a
 * stock ledger starts lying.
 */
export const productionYield = ({
  consumed,
  produced,
  remnant,
  inputUnitCost,
}: ProductionYieldInput): ProductionYield => {
  const waste = consumed - produced - remnant;
  const consumedCost = consumed * inputUnitCost;
  const remnantCost = remnant * inputUnitCost;
  const producedCost = consumedCost - remnantCost;

  return {
    waste,
    impossible: waste < 0,
    remnantCost,
    producedCost,
    producedUnitCost: produced > 0 ? producedCost / produced : 0,
  };
};

export type QuoteLinePreviewInput = {
  quantity: number;
  lengthMm: number | null;
  basePrice: number;
  replacementPrice: number;
  purchasePrice: number;
  theoreticalWeight: number;
  productLengthMm: number;
  minProfitMargin: number;
};

/**
 * What a line editor shows for a line that has not been saved yet: the same
 * figures the server will store, priced off the list price alone.
 *
 * The contract's agreed net price and discounts are not applied here — the
 * client has no business holding a customer's pricing terms — so a saved line
 * can come out cheaper than this preview, never dearer. The screen says as much
 * next to the grid.
 */
export const previewQuoteLine = ({
  quantity,
  lengthMm,
  basePrice,
  replacementPrice,
  purchasePrice,
  theoreticalWeight,
  productLengthMm,
  minProfitMargin,
}: QuoteLinePreviewInput): QuoteLineFinancials & { netPrice: number } => {
  const netPrice = basePrice > 0 ? basePrice : replacementPrice;

  return {
    netPrice,
    ...quoteLineFinancials({
      netPrice,
      quantity,
      purchasePrice,
      replacementPrice,
      theoreticalWeight,
      lengthMm: lengthMm !== null && lengthMm > 0 ? lengthMm : productLengthMm,
      minProfitMargin,
    }),
  };
};

/**
 * The summary columns as the quote header stores them — decimal strings, any of
 * which may be null on a row written before the column existed.
 */
export type QuoteSummarySnapshot = {
  materialsRevenue: string | null;
  materialsProfit: string | null;
  materialsProfitReplPrice: string | null;
  optionsRevenue: string | null;
  optionsProfit: string | null;
  optionsProfitReplPrice: string | null;
  surchargesRevenue: string | null;
  surchargesProfit: string | null;
  surchargesProfitReplPrice: string | null;
  transportCosts: string | null;
  handlingCosts: string | null;
  totalExclVat: string | null;
  vatAmount: string | null;
  totalInclVat: string | null;
  avgKiloPrice: string | null;
  totalWeightKg: string | null;
  theorWeightKg: string | null;
};

const sum = (values: number[]): number =>
  values.reduce((total, value) => total + value, 0);

const summaryBlock = (
  revenue: number,
  profit: number,
  profitReplPrice: number,
): QuoteSummaryBlock => ({
  revenue,
  profit,
  profitPercent: profitMarginPercent(revenue, profit),
  profitReplPrice,
  profitReplPricePercent: profitMarginPercent(revenue, profitReplPrice),
});

/**
 * Rolls a quote's lines, options and surcharges up into the read-only summary
 * shown on the quote screen.
 *
 * The shape follows the reference ERP exactly:
 *
 *   - Materials, options and surcharges each report revenue plus two profits —
 *     against actual cost, and against replacement price.
 *   - Transport and handling are costs with no revenue of their own, so they
 *     only ever pull the profit columns down; they never touch revenue.
 *   - The total line is the three revenue blocks added up, less those two costs.
 *   - VAT applies to the net total, and the average kilo price is the net total
 *     spread over the delivered weight.
 *
 * Nothing here is persisted by the caller's hand: the quote header stores this
 * result as a snapshot so the list and the detail screen agree, but the numbers
 * are always derived from the lines, never typed in.
 */
export const computeQuoteSummary = ({
  lines,
  options = [],
  surcharges = [],
  transportCosts = 0,
  handlingCosts = 0,
  vatRatePercent = 0,
}: QuoteSummaryInput): QuoteSummary => {
  const materialsRevenue = sum(lines.map((line) => line.amount));
  const materials = summaryBlock(
    materialsRevenue,
    materialsRevenue - sum(lines.map((line) => line.costAmount)),
    materialsRevenue - sum(lines.map((line) => line.replacementCost)),
  );

  // Options carry no replacement price of their own — the processing costs what
  // it costs — so both profit columns report the same figure.
  const optionsRevenue = sum(options.map((option) => option.amount));
  const optionsProfit = optionsRevenue - sum(options.map((o) => o.cost));
  const optionsBlock = summaryBlock(
    optionsRevenue,
    optionsProfit,
    optionsProfit,
  );

  const surchargesRevenue = sum(surcharges.map((s) => s.amount));
  const surchargesProfit = sum(surcharges.map((s) => s.profit));
  const surchargesBlock = summaryBlock(
    surchargesRevenue,
    surchargesProfit,
    surchargesProfit,
  );

  const totalRevenue =
    materials.revenue + optionsBlock.revenue + surchargesBlock.revenue;
  const nonRevenueCosts = transportCosts + handlingCosts;

  const total = summaryBlock(
    totalRevenue,
    materials.profit +
      optionsBlock.profit +
      surchargesBlock.profit -
      nonRevenueCosts,
    materials.profitReplPrice +
      optionsBlock.profitReplPrice +
      surchargesBlock.profitReplPrice -
      nonRevenueCosts,
  );

  const totalWeightKg = sum(lines.map((line) => line.weightKg));
  const vatAmount = totalRevenue * (vatRatePercent / 100);

  return {
    materials,
    options: optionsBlock,
    surcharges: surchargesBlock,
    transportCosts,
    handlingCosts,
    total,
    vatAmount,
    totalInclVat: totalRevenue + vatAmount,
    avgKiloPrice: totalWeightKg === 0 ? 0 : totalRevenue / totalWeightKg,
    totalWeightKg,
    theoreticalWeightKg: sum(lines.map((line) => line.theoreticalWeightKg)),
  };
};

/**
 * The summary columns an order header stores. Narrower than a quote's: an order
 * has no options, no transport/handling costs of its own and no separate
 * theoretical weight, because by the time it exists the goods have been
 * allocated and their real weight is known.
 */
export type OrderSummarySnapshot = Pick<
  QuoteSummarySnapshot,
  | "materialsRevenue"
  | "materialsProfit"
  | "materialsProfitReplPrice"
  | "surchargesRevenue"
  | "surchargesProfit"
  | "totalExclVat"
  | "vatAmount"
  | "totalInclVat"
  | "avgKiloPrice"
  | "totalWeightKg"
>;

/**
 * An order's stored summary in the shape the shared summary panel renders, so
 * an order and a quote present their worth identically. The blocks an order
 * does not carry read as zero rather than being hidden — the panel's shape is
 * what makes the two documents comparable at a glance.
 */
export const orderSummaryFromSnapshot = (
  order: OrderSummarySnapshot,
): QuoteSummary =>
  quoteSummaryFromSnapshot({
    ...order,
    optionsRevenue: null,
    optionsProfit: null,
    optionsProfitReplPrice: null,
    // Surcharges are agreed at a margin, so their profit is the same figure
    // whichever cost basis is used.
    surchargesProfitReplPrice: order.surchargesProfit,
    transportCosts: null,
    handlingCosts: null,
    theorWeightKg: order.totalWeightKg,
  });

/**
 * Reads the summary a quote header already stores back into the shape the
 * summary panel renders. The percentages are recomputed rather than stored,
 * since a percentage of a stored revenue can never drift from it.
 */
export const quoteSummaryFromSnapshot = (
  quote: QuoteSummarySnapshot,
): QuoteSummary => {
  const transportCosts = Number(quote.transportCosts ?? 0);
  const handlingCosts = Number(quote.handlingCosts ?? 0);

  return {
    materials: summaryBlock(
      Number(quote.materialsRevenue ?? 0),
      Number(quote.materialsProfit ?? 0),
      Number(quote.materialsProfitReplPrice ?? 0),
    ),
    options: summaryBlock(
      Number(quote.optionsRevenue ?? 0),
      Number(quote.optionsProfit ?? 0),
      Number(quote.optionsProfitReplPrice ?? 0),
    ),
    surcharges: summaryBlock(
      Number(quote.surchargesRevenue ?? 0),
      Number(quote.surchargesProfit ?? 0),
      Number(quote.surchargesProfitReplPrice ?? 0),
    ),
    transportCosts,
    handlingCosts,
    total: summaryBlock(
      Number(quote.totalExclVat ?? 0),
      Number(quote.materialsProfit ?? 0) +
        Number(quote.optionsProfit ?? 0) +
        Number(quote.surchargesProfit ?? 0) -
        transportCosts -
        handlingCosts,
      Number(quote.materialsProfitReplPrice ?? 0) +
        Number(quote.optionsProfitReplPrice ?? 0) +
        Number(quote.surchargesProfitReplPrice ?? 0) -
        transportCosts -
        handlingCosts,
    ),
    vatAmount: Number(quote.vatAmount ?? 0),
    totalInclVat: Number(quote.totalInclVat ?? 0),
    avgKiloPrice: Number(quote.avgKiloPrice ?? 0),
    totalWeightKg: Number(quote.totalWeightKg ?? 0),
    theoreticalWeightKg: Number(quote.theorWeightKg ?? 0),
  };
};

/**
 * The summary columns an invoice header stores. The same set an order carries,
 * except that an invoice names its totals after the document rather than the
 * summary — an invoice's "amount excluding VAT" *is* its net total.
 */
export type InvoiceSummarySnapshot = Pick<
  OrderSummarySnapshot,
  | "materialsRevenue"
  | "materialsProfit"
  | "materialsProfitReplPrice"
  | "surchargesRevenue"
  | "surchargesProfit"
  | "avgKiloPrice"
  | "totalWeightKg"
> & {
  invoiceAmountExclVat: string | null;
  invoiceAmountInclVat: string | null;
};

/**
 * An invoice's stored summary in the shape the shared summary panel renders, so
 * a quote, its order and the invoice that bills it all present their worth the
 * same way and can be read against each other without conversion.
 *
 * VAT is the gap between the two stored totals rather than a column of its own:
 * the invoice already stores both, and deriving it keeps the three figures from
 * ever disagreeing.
 */
export const invoiceSummaryFromSnapshot = (
  invoice: InvoiceSummarySnapshot,
): QuoteSummary =>
  orderSummaryFromSnapshot({
    ...invoice,
    totalExclVat: invoice.invoiceAmountExclVat,
    totalInclVat: invoice.invoiceAmountInclVat,
    vatAmount: (
      Number(invoice.invoiceAmountInclVat ?? 0) -
      Number(invoice.invoiceAmountExclVat ?? 0)
    ).toFixed(2),
  });

// ---------------------------------------------------------------------------
// Text usage categories
//
// `Texts` records which documents a text block may be printed on as one boolean
// column per document, rather than as a list. The mapping between the enum and
// those columns is needed by every screen that reads a text — the overview
// prints a checkbox per column, the detail screen prints the enabled ones as a
// list — so it lives here instead of being re-typed at each call site.
// ---------------------------------------------------------------------------

/**
 * The boolean columns on `Texts` that carry the usage categories. Declared
 * structurally so this module stays free of a database import; `SelectTexts`
 * satisfies it.
 */
export type TextUsageFlags = {
  visitReport: boolean | null;
  purchaseQuoteRequest: boolean | null;
  purchaseOrder: boolean | null;
  purchaseOrderToolTip: boolean | null;
  purchaseReturnOrder: boolean | null;
  salesQuote: boolean | null;
  salesOrder: boolean | null;
  salesOrderToolTip: boolean | null;
  salesInvoice: boolean | null;
  warehouseOrder: boolean | null;
  productionOrder: boolean | null;
  loadlist: boolean | null;
  waybill: boolean | null;
  rideList: boolean | null;
  customerLabel: boolean | null;
  transportPlanning: boolean | null;
  websiteInAdvance: boolean | null;
  websiteAfter: boolean | null;
};

export type TextUsageCategoryField = keyof TextUsageFlags;

/** A document a text is attached to, as a link. */
export type AttachedDocument = {
  label: string;
  href: string;
};

/** The document keys a `Texts` row can carry — at most one of them is set. */
export type TextAttachmentSource = {
  orderUuid: string | null;
  orderId: number | null;
  quoteUuid: string | null;
  quoteId: number | null;
  counterOrderUuid: string | null;
  counterOrderId: number | null;
  returnOrderUuid: string | null;
  returnOrderId: number | null;
  purchaseOrderUuid: string | null;
  purchaseOrderId: number | null;
  purchaseQuoteUuid: string | null;
  purchaseQuoteId: number | null;
  purchaseRequestUuid: string | null;
  purchaseRequestId: number | null;
  purchaseReturnOrderUuid: string | null;
  purchaseReturnOrderId: number | null;
};

/** Each usage category paired with the `Texts` column that records it. */
export const TEXT_USAGE_CATEGORY_FIELDS: Array<{
  key: TextUsageCategory;
  field: TextUsageCategoryField;
}> = [
  { key: "visit_report", field: "visitReport" },
  { key: "purchase_quote_request", field: "purchaseQuoteRequest" },
  { key: "purchase_order", field: "purchaseOrder" },
  { key: "purchase_order_tool_tip", field: "purchaseOrderToolTip" },
  { key: "purchase_return_order", field: "purchaseReturnOrder" },
  { key: "sales_quote", field: "salesQuote" },
  { key: "sales_order", field: "salesOrder" },
  { key: "sales_order_tool_tip", field: "salesOrderToolTip" },
  { key: "sales_invoice", field: "salesInvoice" },
  { key: "warehouse_order", field: "warehouseOrder" },
  { key: "production_order", field: "productionOrder" },
  { key: "loadlist", field: "loadlist" },
  { key: "waybill", field: "waybill" },
  { key: "ride_list", field: "rideList" },
  { key: "customer_label", field: "customerLabel" },
  { key: "transport_planning", field: "transportPlanning" },
  { key: "website_in_advance", field: "websiteInAdvance" },
  { key: "website_after", field: "websiteAfter" },
];

/**
 * The one document a text hangs off, if any.
 *
 * A text carries at most one of these keys, so the first one set is the answer;
 * a text with none is a library text belonging to the company (or to nothing)
 * rather than to a document.
 */
export const attachedDocumentOf = (
  text: TextAttachmentSource,
): AttachedDocument | null => {
  const attachments: Array<{
    uuid: string | null;
    id: number | null;
    noun: string;
    path: string;
  }> = [
    { uuid: text.orderUuid, id: text.orderId, noun: "Order", path: "orders" },
    { uuid: text.quoteUuid, id: text.quoteId, noun: "Quote", path: "quotes" },
    {
      uuid: text.counterOrderUuid,
      id: text.counterOrderId,
      noun: "Counter order",
      path: "counter-orders",
    },
    {
      uuid: text.returnOrderUuid,
      id: text.returnOrderId,
      noun: "Return order",
      path: "return-orders",
    },
    {
      uuid: text.purchaseOrderUuid,
      id: text.purchaseOrderId,
      noun: "Purchase order",
      path: "purchase-orders",
    },
    {
      uuid: text.purchaseQuoteUuid,
      id: text.purchaseQuoteId,
      noun: "Purchase quote",
      path: "purchase-quotes",
    },
    {
      uuid: text.purchaseRequestUuid,
      id: text.purchaseRequestId,
      noun: "Purchase request",
      path: "purchase-requests",
    },
    {
      uuid: text.purchaseReturnOrderUuid,
      id: text.purchaseReturnOrderId,
      noun: "Purchase return order",
      path: "purchase-return-orders",
    },
  ];

  const attached = attachments.find(
    (candidate) => candidate.uuid !== null && candidate.id !== null,
  );
  if (!attached) {
    return null;
  }
  return {
    label: `${attached.noun} #${attached.id}`,
    href: `/${attached.path}/${attached.uuid}`,
  };
};

/**
 * The labels of the documents a text block is switched on for, in the order the
 * categories are declared. Empty when the text is not printed anywhere.
 */
export const activeTextUsageCategories = (text: TextUsageFlags): string[] =>
  TEXT_USAGE_CATEGORY_FIELDS.filter(({ field }) => text[field]).map(
    ({ key }) => TEXT_USAGE_CATEGORY_LABELS[key],
  );

/**
 * The boolean flags an order carries instead of a single "type" column. An order
 * can be several of these at once — a consignment order collected by the
 * customer is both — which is why there is no one enum for it.
 */
export type OrderTypeFlags = {
  isPickup: boolean | null;
  isIncidental: boolean | null;
  isConsignment: boolean | null;
  isInternalProduction: boolean | null;
  isCustomerMaterial: boolean | null;
  isOverlength: boolean | null;
};

/**
 * How an order describes its own type, for the production and logistics reports
 * that print it as one column: every flag that is set, comma separated, or
 * "Standard" when none is.
 */
export const describeOrderType = (flags: OrderTypeFlags): string => {
  const labelled: Array<[boolean | null, string]> = [
    [flags.isPickup, "Pickup"],
    [flags.isIncidental, "Incidental"],
    [flags.isConsignment, "Consignment"],
    [flags.isInternalProduction, "Internal production"],
    [flags.isCustomerMaterial, "Customer material"],
    [flags.isOverlength, "Overlength"],
  ];
  const active = labelled.filter(([on]) => on).map(([, label]) => label);
  return active.length > 0 ? active.join(", ") : "Standard";
};

/**
 * Whether a purchase quote may still be edited.
 *
 * An awarded quote is the head of the cost chain: a purchase order was raised
 * from it, and its prices are what stock received against that order is valued
 * at. Editing it afterwards would leave the order disagreeing with its own
 * source, so a decided quote is read-only.
 *
 * `expired` stays editable on purpose — that is how the validity date gets
 * extended.
 */
export const isPurchaseQuoteEditable = (
  status: PurchaseQuoteStatus | null,
): boolean => status !== "awarded" && status !== "lost";

/**
 * Whether a purchase request's header may still be edited — the same terminal
 * states the conversion actions refuse to act on.
 */
export const isPurchaseRequestEditable = (
  status: PurchaseRequestStatus | null,
): boolean => status !== "awarded" && status !== "cancelled";

/**
 * Whether a purchase request's lines may still be changed.
 *
 * Asking a supplier for a quote copies the request's lines onto that quote. Once
 * that has happened the lines are the question that was actually asked, and
 * editing them would leave the answers on file responding to something else — so
 * they are frozen the moment the request leaves draft.
 */
export const canEditPurchaseRequestLines = (
  status: PurchaseRequestStatus | null,
): boolean => status === null || status === "draft";

/**
 * Whether a purchase return order may still be edited.
 *
 * Dispatching one moves stock out of the lot the goods arrived in, and
 * crediting one raises a supplier credit note against it. Once either has
 * happened the paperwork describes something that physically occurred, so the
 * terms behind it are frozen.
 */
export const isPurchaseReturnOrderEditable = (
  status: ReturnOrderStatus | null,
): boolean =>
  status !== "received" && status !== "credited" && status !== "cancelled";

// ---------------------------------------------------------------------------
// Charts
//
// The geometry and the shortened figures the dashboard's charts are drawn from.
// They are plain arithmetic on numbers, so they live here rather than inside a
// component: every chart on the page then rounds its axis, rounds its bar caps
// and shortens its labels the same way.
// ---------------------------------------------------------------------------

/** Whether a figure moved up, moved down, or held still against a baseline. */
export type TrendDirection = "up" | "down" | "flat";

/** What kind of figure a chart plots, which decides how its labels read. */
export type ChartValueFormat = "money" | "number";

/**
 * A shortened number for a headline figure — `1,284`, `12.9K`, `4.2M`.
 *
 * Only for a value read on its own (a tile, an axis tick). A column of figures
 * that has to add up keeps `formatNumber`, since rounding to one decimal makes
 * the parts stop summing to the total.
 */
export const formatCompactNumber = (value: number): string => {
  const magnitude = Math.abs(value);
  if (magnitude >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })}M`;
  }
  if (magnitude >= 10_000) {
    return `${(value / 1_000).toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })}K`;
  }
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
};

/**
 * The same shortening as a euro amount, e.g. `€ 4.2M`.
 */
export const formatCompactMoney = (value: number): string =>
  `€ ${formatCompactNumber(value)}`;

/**
 * A percentage at one decimal, e.g. `12.4%` — the precision a rate is read at
 * on a tile, where a second decimal is noise.
 */
export const formatPercentOneDecimal = (value: number): string =>
  formatPercent(Math.round(value * 10) / 10);

/**
 * A figure as a chart reads it: exact, since this is the number the reader
 * takes away from a tooltip or a bar.
 */
export const formatChartValue = (
  value: number,
  format: ChartValueFormat,
): string => (format === "money" ? formatMoney(value) : formatNumber(value));

/**
 * The same figure shortened for an axis tick or a direct label, where the
 * space is a few characters wide.
 */
export const formatChartTick = (
  value: number,
  format: ChartValueFormat,
): string =>
  format === "money" ? formatCompactMoney(value) : formatCompactNumber(value);

/**
 * Which way a figure moved, for the arrow beside it.
 */
export const trendDirection = (value: number): TrendDirection => {
  if (value > 0) {
    return "up";
  }
  if (value < 0) {
    return "down";
  }
  return "flat";
};

/**
 * The sentence under a revenue figure: how it compares with the same run of
 * days a year earlier.
 *
 * A year with nothing invoiced in it is said so in words rather than shown as a
 * percentage, because there is no baseline to be a percentage of.
 */
export const describeRevenueChange = (
  changePercent: number | null,
  previousYear: number,
): { text: string; direction: TrendDirection } => {
  if (changePercent === null) {
    return {
      text: `Nothing invoiced in the same run of ${previousYear}`,
      direction: "flat",
    };
  }
  const rounded = Math.round(changePercent * 10) / 10;
  return {
    text: `${rounded > 0 ? "+" : ""}${formatPercent(rounded)} against ${previousYear} to the same day`,
    direction: trendDirection(rounded),
  };
};

/**
 * How much a figure moved against the period before it, as a percentage.
 *
 * Null when the earlier period was zero: growth from nothing is not a
 * percentage, and reporting it as one (or as 100%) invents a baseline that was
 * never there.
 */
export const percentChange = (
  current: number,
  previous: number,
): number | null => {
  if (previous === 0) {
    return null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
};

/**
 * A round number at or above the largest value plotted, for the top of a chart
 * axis — so the ticks read 0 / 500 / 1,000 rather than 0 / 437 / 874.
 */
export const niceAxisMax = (value: number): number => {
  if (value <= 0) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const scaled = value / magnitude;
  const step =
    [1, 2, 2.5, 5, 10].find((candidate) => scaled <= candidate) ?? 10;
  return step * magnitude;
};

/**
 * The evenly spaced tick values from zero up to `max`, smallest first.
 */
export const axisTicks = (max: number, steps: number = 4): number[] =>
  Array.from({ length: steps + 1 }, (_, index) => (max / steps) * index);

/**
 * The path of a column: rounded at the data end, square where it meets the
 * baseline, so the bar still reads as growing from zero.
 *
 * The radius is clamped to the bar itself, which keeps a very short column from
 * curling into a lens shape.
 */
export const columnPath = ({
  x,
  y,
  width,
  height,
  radius = 4,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
}): string => {
  const r = Math.max(0, Math.min(radius, width / 2, height));
  const bottom = y + height;
  return [
    `M ${x} ${bottom}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `L ${x + width} ${bottom}`,
    "Z",
  ].join(" ");
};

/**
 * Where a sparkline ends inside its box — the point the current-period marker
 * is drawn on. Scaled exactly as `sparklinePath` scales the line, so the dot
 * can never drift off it.
 */
export const sparklineEndPoint = (
  values: number[],
  width: number,
  height: number,
): { x: number; y: number } => {
  const last = values[values.length - 1];
  if (last === undefined) {
    return { x: 0, y: height / 2 };
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  return {
    x: width,
    y: span === 0 ? height / 2 : height - ((last - min) / span) * height,
  };
};

/**
 * The path of a sparkline through `values`, drawn to fill the given box.
 *
 * A flat run sits on the middle of the box rather than on its floor, so "no
 * movement" does not read as "at zero".
 */
export const sparklinePath = (
  values: number[],
  width: number,
  height: number,
): string => {
  if (values.length === 0) {
    return "";
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const step = values.length > 1 ? width / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const y =
        span === 0 ? height / 2 : height - ((value - min) / span) * height;
      return `${index === 0 ? "M" : "L"} ${index * step} ${y}`;
    })
    .join(" ");
};

// ---------------------------------------------------------------------------
// Status colour
// ---------------------------------------------------------------------------

/** How a status reads at a glance, before anyone has read the word. */
export type StatusTone =
  | "neutral"
  | "active"
  | "done"
  | "attention"
  | "critical";

/**
 * Which tone a stored status wears.
 *
 * Keyed on the stored value rather than on the table it came from, because the
 * same words mean the same thing across the system: "cancelled" is cancelled
 * whether it was an order, a purchase order or a complaint. A value nobody has
 * classified stays neutral rather than being guessed at.
 */
const STATUS_TONES: Record<string, StatusTone> = {
  draft: "neutral",
  new: "neutral",
  open: "neutral",
  pending: "neutral",
  quoted: "neutral",
  first: "neutral",
  second: "neutral",
  not_ready: "neutral",
  confirmed: "active",
  in_progress: "active",
  reserved: "active",
  released: "active",
  pre_notified: "active",
  sent: "active",
  partially_delivered: "active",
  partially_invoiced: "active",
  ready: "active",
  completed: "done",
  done: "done",
  delivered: "done",
  invoiced: "done",
  received: "done",
  credited: "done",
  awarded: "done",
  ok: "done",
  full: "done",
  on_hold: "attention",
  warning: "attention",
  expired: "attention",
  returned: "attention",
  final: "attention",
  cancelled: "critical",
  lost: "critical",
};

export const statusTone = (value: string | null | undefined): StatusTone =>
  value ? (STATUS_TONES[value] ?? "neutral") : "neutral";
