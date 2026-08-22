import { clsx, ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  AgeingBucket,
  ageingBuckets,
  ArticleGroup,
  CertificaatOption,
  ContractableRole,
  contractableRoles,
  ContractType,
  ComplaintCategory,
  CountWorkorderMethod,
  CustomerLabelOption,
  ComplaintSolution,
  CustomerGroup,
  DeliveryTerm,
  DeliveryTimeUnit,
  DeliveryType,
  FeaturesQuality,
  InvoicePaymentTerm,
  InvoiceDocumentType,
  InvoiceVatScenario,
  InvoiceSurchargeDescription,
  LeadTimeMethod,
  LedgerAccountType,
  MachineCapacityUnit,
  MachineOptionType,
  MachineProductionType,
  machineProductionTypes,
  MaterialFamily,
  MaterialSurfaceFinish,
  OrderDeblockType,
  OrderLineStatus,
  OrderWeightType,
  PrinterEntry,
  PrinterName,
  ProcessingEditing,
  ProductDimensionShape,
  ProductShape,
  PurchaseOrderStatus,
  PurchaseQuoteStatus,
  PurchaseRequestStatus,
  ReminderStage,
  reminderStages,
  RevenueGroup,
  revenueGroups,
  RevenueGroupKind,
  ReturnOrderReason,
  ReturnOrderStatus,
  SalesRepresentative,
  SfnCounterpartyRole,
  StockMode,
  StickerPerPickWorkorderType,
  StockLabelBreakdown,
  StockLabelType,
  StockUnit,
  StockMovementType,
  SurchargeBasis,
  TextUsageCategory,
  TransporterPriceUnit,
  TransportMode,
  transportModes,
  VatCode,
  WarehouseBlockReason,
  WarehouseCountStockType,
  WarehouseLocationType,
  warehouseLocationTypes,
  WarehouseTransportRegion,
  warehouseTransportRegions,
  WarehouseWorkOrderLineType,
  warehouseWorkOrderLineTypes,
  WorkorderPrintMethod,
  WorkorderReleaseMethod,
  WorkorderSlipType,
} from "./enums";
import {
  CONTRACT_TYPE_LABELS,
  CUSTOMER_GROUP_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  REVENUE_GROUP_LABELS,
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
 * A stored user reference as a person's name.
 *
 * Clerk owns the user list and there is no local Users table, so every column
 * that refers to a person — seller, purchaser, created by, responsible for,
 * blocked by — holds a Clerk id. Printing that id is printing
 * `user_3EImbVyJV9yjKPDmndXbEb3bUZD` at somebody, which names nobody.
 *
 * Three cases, all of which occur:
 *   - an id Clerk knows becomes that person's name;
 *   - an id it no longer knows — someone who has left — reads as "Unknown
 *     user", because the raw id tells a reader strictly less than that;
 *   - a value that is not a Clerk id passes through unchanged, since these are
 *     plain varchar columns and some rows hold a name that was typed in.
 *
 * Pair with `getClerkUserNames` from lib/server/clerk.ts, which builds the map.
 */
export const userName = (
  value: string | null | undefined,
  names: Record<string, string>,
): string => {
  if (!value) {
    return "—";
  }
  const resolved = names[value];
  if (resolved) {
    return resolved;
  }
  return value.startsWith("user_") ? "Unknown user" : value;
};

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
// Material grades and cross-sections
//
// A grade code is metallurgy, not a label. It fixes the density every
// theoretical weight is computed from, the alloy content an alloy surcharge is
// charged on, whether the surface has to be protected in transit, and whether
// the material is magnetic — which is how the yard tells a 300-series offcut
// from a 400-series one. None of that can be typed per article without
// drifting, so it is read off the grade instead.
//
// A grade is parsed as a base grade plus a surface/condition suffix, because
// that is how the codes are built: `316L2B` is 316L in a 2B finish, `C45+QT`
// is C45 quenched and tempered. The base decides the metal, the suffix decides
// the surface.
//
// The cross-section formula that turns dimensions into kilograms is read off
// the shape in the same way: a round bar's area comes from its diameter, a
// tube's from its wall, and a beam's from a profile table the system does not
// hold — so a beam keeps the weight per metre that was typed for it rather
// than being given an invented one.
// ---------------------------------------------------------------------------

/**
 * The alloying elements an alloy surcharge is charged on, as mass percentages.
 * Only the three the scrap market prices separately are held, plus titanium,
 * which is what distinguishes a stabilised grade from its plain counterpart.
 */
export type MaterialAlloyContent = {
  chromium: number;
  nickel: number;
  molybdenum: number;
  titanium: number;
};

/** What a base grade code means, before any surface suffix. */
export type MaterialBaseGrade = {
  /** The base code itself, e.g. `316L`. */
  code: string;
  family: MaterialFamily;
  /** kg/dm³ — the figure every theoretical weight is computed from. */
  density: number;
  alloy: MaterialAlloyContent;
  /**
   * Corrosion resistance class per EN 1993-1-4, where a higher class survives a
   * harsher environment. Null for grades the standard does not class, which is
   * every non-stainless one.
   */
  corrosionClass: 1 | 2 | 3 | 4 | 5 | null;
  /** Ferritic and martensitic grades are magnetic; austenitic ones are not. */
  magnetic: boolean;
};

/** What a surface/condition suffix means. */
export type MaterialFinish = {
  finish: MaterialSurfaceFinish;
  /** The surface is damaged by handling, so it travels under foil. */
  requiresProtectiveFoil: boolean;
  /** The surface stays visible in the finished product. */
  decorative: boolean;
  /** Cold rolled, and so held to a tighter thickness tolerance. */
  coldRolled: boolean;
  /** Carries a metallic coating, so cut edges need touching up. */
  coated: boolean;
};

/** Everything a grade code decides, base and surface together. */
export type MaterialGradeMeta = {
  base: MaterialBaseGrade;
  surface: MaterialFinish;
};

/**
 * The dimensions a shape actually uses, and whether its cross-section can be
 * derived from them at all.
 */
export type DimensionShapeGeometry = {
  usesLength: boolean;
  usesWidthDiameter: boolean;
  usesThickness: boolean;
  /**
   * False when the cross-section comes from a profile table rather than from
   * the three dimensions on the article — a beam, in other words.
   */
  derivable: boolean;
};

/** The dimensions of a single article, in millimetres. */
export type ArticleDimensions = {
  length?: number | null;
  widthDiameter?: number | null;
  thickness?: number | null;
};

/** The three derived weight/surface figures an article carries. */
export type DerivedArticleWeights = {
  /** kg per running metre. */
  weightPerM1: number;
  /** m² of paintable surface per running metre. */
  paintSurfacePerM1: number;
  /** kg for one piece at the article's own length. */
  weightTheoretical: number;
};

/**
 * The base grades, longest code first so that `304L2B` matches `304L` and not
 * `304`. Densities are the accepted figures for each family; alloy contents are
 * the mid-points of the composition ranges, which is what an alloy surcharge is
 * charged on.
 */
export const MATERIAL_BASE_GRADES: readonly MaterialBaseGrade[] = [
  // ── Austenitic stainless ────────────────────────────────────────────────
  {
    code: "300-serie",
    family: "stainless_austenitic",
    density: 7.9,
    alloy: { chromium: 18, nickel: 8, molybdenum: 0, titanium: 0 },
    corrosionClass: 3,
    magnetic: false,
  },
  {
    code: "304-serie",
    family: "stainless_austenitic",
    density: 7.9,
    alloy: { chromium: 18.1, nickel: 8.1, molybdenum: 0, titanium: 0 },
    corrosionClass: 3,
    magnetic: false,
  },
  {
    code: "316-serie",
    family: "stainless_austenitic",
    density: 8.0,
    alloy: { chromium: 16.9, nickel: 10.2, molybdenum: 2.1, titanium: 0 },
    corrosionClass: 4,
    magnetic: false,
  },
  {
    code: "301",
    family: "stainless_austenitic",
    density: 7.9,
    alloy: { chromium: 17, nickel: 7, molybdenum: 0, titanium: 0 },
    corrosionClass: 3,
    magnetic: false,
  },
  {
    code: "303",
    family: "stainless_austenitic",
    density: 7.9,
    alloy: { chromium: 17.5, nickel: 8.5, molybdenum: 0, titanium: 0 },
    corrosionClass: 2,
    magnetic: false,
  },
  {
    code: "304L",
    family: "stainless_austenitic",
    density: 7.9,
    alloy: { chromium: 18.2, nickel: 10, molybdenum: 0, titanium: 0 },
    corrosionClass: 3,
    magnetic: false,
  },
  {
    code: "304",
    family: "stainless_austenitic",
    density: 7.9,
    alloy: { chromium: 18.1, nickel: 8.1, molybdenum: 0, titanium: 0 },
    corrosionClass: 3,
    magnetic: false,
  },
  {
    code: "309H",
    family: "stainless_heat_resistant",
    density: 7.9,
    alloy: { chromium: 22, nickel: 13, molybdenum: 0, titanium: 0 },
    corrosionClass: 3,
    magnetic: false,
  },
  {
    code: "309",
    family: "stainless_heat_resistant",
    density: 7.9,
    alloy: { chromium: 22, nickel: 13, molybdenum: 0, titanium: 0 },
    corrosionClass: 3,
    magnetic: false,
  },
  {
    code: "310S",
    family: "stainless_heat_resistant",
    density: 7.9,
    alloy: { chromium: 24.5, nickel: 19.5, molybdenum: 0, titanium: 0 },
    corrosionClass: 3,
    magnetic: false,
  },
  {
    code: "310",
    family: "stainless_heat_resistant",
    density: 7.9,
    alloy: { chromium: 24.5, nickel: 19.5, molybdenum: 0, titanium: 0 },
    corrosionClass: 3,
    magnetic: false,
  },
  {
    code: "316L",
    family: "stainless_austenitic",
    density: 8.0,
    alloy: { chromium: 17, nickel: 10.1, molybdenum: 2.1, titanium: 0 },
    corrosionClass: 4,
    magnetic: false,
  },
  {
    code: "316T",
    family: "stainless_austenitic",
    density: 8.0,
    alloy: { chromium: 16.9, nickel: 11, molybdenum: 2.1, titanium: 0.4 },
    corrosionClass: 4,
    magnetic: false,
  },
  {
    code: "316",
    family: "stainless_austenitic",
    density: 8.0,
    alloy: { chromium: 16.9, nickel: 10.2, molybdenum: 2.1, titanium: 0 },
    corrosionClass: 4,
    magnetic: false,
  },
  {
    code: "321",
    family: "stainless_austenitic",
    density: 7.9,
    alloy: { chromium: 17.5, nickel: 9.2, molybdenum: 0, titanium: 0.4 },
    corrosionClass: 3,
    magnetic: false,
  },
  {
    code: "4835",
    family: "stainless_heat_resistant",
    density: 7.8,
    alloy: { chromium: 21, nickel: 11, molybdenum: 0, titanium: 0 },
    corrosionClass: 3,
    magnetic: false,
  },
  // ── Ferritic and martensitic stainless ──────────────────────────────────
  {
    code: "400-serie",
    family: "stainless_ferritic",
    density: 7.7,
    alloy: { chromium: 16.5, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: 2,
    magnetic: true,
  },
  {
    code: "4003",
    family: "stainless_ferritic",
    density: 7.7,
    alloy: { chromium: 11.5, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: 1,
    magnetic: true,
  },
  {
    code: "4510Ti",
    family: "stainless_ferritic",
    density: 7.7,
    alloy: { chromium: 17.5, nickel: 0, molybdenum: 0, titanium: 0.4 },
    corrosionClass: 2,
    magnetic: true,
  },
  {
    code: "4513",
    family: "stainless_ferritic",
    density: 7.7,
    alloy: { chromium: 17.5, nickel: 0, molybdenum: 1.2, titanium: 0.4 },
    corrosionClass: 4,
    magnetic: true,
  },
  {
    code: "409",
    family: "stainless_ferritic",
    density: 7.7,
    alloy: { chromium: 11.2, nickel: 0, molybdenum: 0, titanium: 0.2 },
    corrosionClass: 1,
    magnetic: true,
  },
  {
    code: "410S",
    family: "stainless_martensitic",
    density: 7.7,
    alloy: { chromium: 12.5, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: 1,
    magnetic: true,
  },
  {
    code: "430",
    family: "stainless_ferritic",
    density: 7.7,
    alloy: { chromium: 16.5, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: 2,
    magnetic: true,
  },
  {
    code: "431",
    family: "stainless_martensitic",
    density: 7.7,
    alloy: { chromium: 16, nickel: 2, molybdenum: 0, titanium: 0 },
    corrosionClass: 2,
    magnetic: true,
  },
  {
    code: "439",
    family: "stainless_ferritic",
    density: 7.7,
    alloy: { chromium: 17.5, nickel: 0, molybdenum: 0, titanium: 0.3 },
    corrosionClass: 2,
    magnetic: true,
  },
  {
    code: "441",
    family: "stainless_ferritic",
    density: 7.7,
    alloy: { chromium: 18, nickel: 0, molybdenum: 0, titanium: 0.2 },
    corrosionClass: 2,
    magnetic: true,
  },
  {
    code: "444",
    family: "stainless_ferritic",
    density: 7.7,
    alloy: { chromium: 18, nickel: 0, molybdenum: 2, titanium: 0.2 },
    corrosionClass: 4,
    magnetic: true,
  },
  // ── Aluminium ───────────────────────────────────────────────────────────
  {
    code: "A1050",
    family: "aluminium",
    density: 2.705,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: false,
  },
  {
    code: "A3103",
    family: "aluminium",
    density: 2.73,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: false,
  },
  {
    code: "A5005",
    family: "aluminium",
    density: 2.7,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: false,
  },
  {
    code: "A5083",
    family: "aluminium",
    density: 2.66,
    alloy: { chromium: 0.1, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: false,
  },
  {
    code: "A5754",
    family: "aluminium",
    density: 2.67,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: false,
  },
  {
    code: "A6082",
    family: "aluminium",
    density: 2.7,
    alloy: { chromium: 0.1, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: false,
  },
  {
    code: "AlCuBiPb",
    family: "aluminium",
    density: 2.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: false,
  },
  {
    code: "AlCuMgPb",
    family: "aluminium",
    density: 2.82,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: false,
  },
  {
    code: "AlMg4.5Mn0.7",
    family: "aluminium",
    density: 2.66,
    alloy: { chromium: 0.1, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: false,
  },
  {
    code: "AlMgSi0.5",
    family: "aluminium",
    density: 2.7,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: false,
  },
  {
    code: "AlMgSi1",
    family: "aluminium",
    density: 2.7,
    alloy: { chromium: 0.1, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: false,
  },
  {
    code: "Alu",
    family: "aluminium",
    density: 2.7,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: false,
  },
  // ── Carbon, alloy and coated steel ──────────────────────────────────────
  {
    code: "115CrV3",
    family: "tool_steel",
    density: 7.8,
    alloy: { chromium: 0.6, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "11SMnPb30",
    family: "free_cutting_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "11SMn30",
    family: "free_cutting_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "34CrNiMo6",
    family: "quenched_tempered_steel",
    density: 7.85,
    alloy: { chromium: 1.5, nickel: 1.5, molybdenum: 0.2, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "42CrMoS4",
    family: "quenched_tempered_steel",
    density: 7.85,
    alloy: { chromium: 1.05, nickel: 0, molybdenum: 0.22, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "42MnV7",
    family: "quenched_tempered_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "A105N",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "A106 Grade B",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "A234 Grade WPB",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "B500A-HKN",
    family: "reinforcement_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "B500B-HWL",
    family: "reinforcement_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "C15R",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "C22",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "C35R",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "C35",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "C45",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "C60R",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "C85S",
    family: "tool_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "DC01",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "DX51D",
    family: "coated_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "E195",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "E220",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "E-Cu",
    family: "copper",
    density: 8.93,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: false,
  },
  // A house grouping rather than a standardised grade; carbon steel is what
  // every article in it has turned out to be, so it is weighed as such.
  {
    code: "HA-serie",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "Laserpress 240",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "Ms58",
    family: "brass",
    density: 8.47,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: false,
  },
  {
    code: "Ms63",
    family: "brass",
    density: 8.44,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: false,
  },
  {
    code: "P195T",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "P235GH",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "P235TR1",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "P250GH",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
  {
    code: "Rg12",
    family: "bronze",
    density: 8.6,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: false,
  },
  {
    code: "Rg7",
    family: "bronze",
    density: 8.8,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: false,
  },
  {
    code: "S195T",
    family: "carbon_steel",
    density: 7.85,
    alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
    corrosionClass: null,
    magnetic: true,
  },
];

/**
 * The surface/condition suffixes, longest token first so that `+C/SH` is read
 * as drawn-and-peeled rather than as a plain `+C`.
 */
export const MATERIAL_FINISHES: readonly (MaterialFinish & {
  token: string;
})[] = [
  {
    token: "+ZE25/25APC",
    finish: "electro_galvanised",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: true,
    coated: true,
  },
  {
    token: "+Z275MAC",
    finish: "hot_dip_galvanised",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: false,
    coated: true,
  },
  {
    token: "+C/SH",
    finish: "cold_drawn",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: true,
    coated: false,
  },
  {
    token: "AF/SB",
    finish: "brushed",
    requiresProtectiveFoil: true,
    decorative: true,
    coldRolled: true,
    coated: false,
  },
  {
    token: "O2TR",
    finish: "annealed",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: true,
    coated: false,
  },
  {
    token: "O5TR",
    finish: "annealed",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: true,
    coated: false,
  },
  {
    token: "DECO",
    finish: "decorative",
    requiresProtectiveFoil: true,
    decorative: true,
    coldRolled: true,
    coated: false,
  },
  {
    token: "H111",
    finish: "strain_hardened",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: false,
    coated: false,
  },
  {
    token: "WGW",
    finish: "hot_rolled_plate",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: false,
    coated: false,
  },
  {
    token: "NO4",
    finish: "polished",
    requiresProtectiveFoil: true,
    decorative: true,
    coldRolled: true,
    coated: false,
  },
  {
    token: "POL",
    finish: "polished",
    requiresProtectiveFoil: true,
    decorative: true,
    coldRolled: true,
    coated: false,
  },
  {
    token: "DIV",
    finish: "mixed",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: false,
    coated: false,
  },
  {
    token: "2BB",
    finish: "cold_rolled_extra_bright",
    requiresProtectiveFoil: true,
    decorative: true,
    coldRolled: true,
    coated: false,
  },
  {
    token: "H14",
    finish: "strain_hardened",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: true,
    coated: false,
  },
  {
    token: "H22",
    finish: "strain_hardened",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: true,
    coated: false,
  },
  {
    token: "H24",
    finish: "strain_hardened",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: true,
    coated: false,
  },
  {
    token: "+QT",
    finish: "heat_treated",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: false,
    coated: false,
  },
  {
    token: "+SL",
    finish: "stress_relieved",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: false,
    coated: false,
  },
  {
    token: "-Am",
    finish: "mill",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: true,
    coated: false,
  },
  {
    token: "+C",
    finish: "cold_drawn",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: true,
    coated: false,
  },
  {
    token: "+N",
    finish: "annealed",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: false,
    coated: false,
  },
  {
    token: "1D",
    finish: "hot_rolled_pickled",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: false,
    coated: false,
  },
  {
    token: "2B",
    finish: "cold_rolled_bright",
    requiresProtectiveFoil: true,
    decorative: true,
    coldRolled: true,
    coated: false,
  },
  {
    token: "2D",
    finish: "cold_rolled_dull",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: true,
    coated: false,
  },
  {
    token: "2E",
    finish: "cold_rolled_descaled",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: true,
    coated: false,
  },
  {
    token: "4N",
    finish: "ground",
    requiresProtectiveFoil: true,
    decorative: true,
    coldRolled: true,
    coated: false,
  },
  {
    token: "BA",
    finish: "bright_annealed",
    requiresProtectiveFoil: true,
    decorative: true,
    coldRolled: true,
    coated: false,
  },
  {
    token: "SB",
    finish: "brushed",
    requiresProtectiveFoil: true,
    decorative: true,
    coldRolled: true,
    coated: false,
  },
  {
    token: "T6",
    finish: "heat_treated",
    requiresProtectiveFoil: false,
    decorative: false,
    coldRolled: false,
    coated: false,
  },
];

/** What a grade with no recognised suffix is delivered as. */
export const MILL_FINISH: MaterialFinish = {
  finish: "mill",
  requiresProtectiveFoil: false,
  decorative: false,
  coldRolled: false,
  coated: false,
};

/**
 * The grade a code falls back to when it matches no base at all. Carbon steel
 * at 7.85 is the least surprising assumption for an unrecognised steel code,
 * and it keeps a weight computation from returning zero for want of a density.
 */
export const UNKNOWN_BASE_GRADE: MaterialBaseGrade = {
  code: "",
  family: "carbon_steel",
  density: 7.85,
  alloy: { chromium: 0, nickel: 0, molybdenum: 0, titanium: 0 },
  corrosionClass: null,
  magnetic: true,
};

// Both lookups match on the longest code first, so that `304L2B` is read as
// 304L rather than as 304, and `+C/SH` as drawn-and-peeled rather than as a
// plain `+C`. Sorting here rather than relying on the order the tables happen
// to be written in means a grade added in the wrong place still resolves.
const BASE_GRADES_LONGEST_FIRST = [...MATERIAL_BASE_GRADES].sort(
  (a, b) => b.code.length - a.code.length,
);

const FINISHES_LONGEST_FIRST = [...MATERIAL_FINISHES].sort(
  (a, b) => b.token.length - a.token.length,
);

/**
 * Splits a grade code into the base grade and the surface suffix it was built
 * from. `316L2B` is 316L in a 2B finish; `C45+QT` is C45 quenched and tempered;
 * `4510Ti BA` is the same with a space the code happens to carry.
 */
export const materialGradeMeta = (
  grade: FeaturesQuality | string | null | undefined,
): MaterialGradeMeta | null => {
  if (!grade) {
    return null;
  }
  const code = grade.trim();
  const base = BASE_GRADES_LONGEST_FIRST.find((candidate) =>
    code.startsWith(candidate.code),
  );
  if (!base) {
    return { base: { ...UNKNOWN_BASE_GRADE, code }, surface: MILL_FINISH };
  }
  const suffix = code.slice(base.code.length).trim();
  const surface =
    FINISHES_LONGEST_FIRST.find((candidate) => suffix === candidate.token) ??
    FINISHES_LONGEST_FIRST.find((candidate) =>
      suffix.startsWith(candidate.token),
    ) ??
    MILL_FINISH;
  return { base, surface };
};

/** The metal family a grade belongs to, or null when none is set. */
export const materialFamilyOf = (
  grade: FeaturesQuality | string | null | undefined,
): MaterialFamily | null => materialGradeMeta(grade)?.base.family ?? null;

/**
 * The density in kg/dm³ every theoretical weight for this grade is computed
 * from. Null when no grade is set, because guessing a density would put a
 * fabricated weight on the article.
 */
export const materialDensityOf = (
  grade: FeaturesQuality | string | null | undefined,
): number | null => materialGradeMeta(grade)?.base.density ?? null;

/** The surface a grade is delivered in, or null when none is set. */
export const materialSurfaceFinishOf = (
  grade: FeaturesQuality | string | null | undefined,
): MaterialSurfaceFinish | null =>
  materialGradeMeta(grade)?.surface.finish ?? null;

/** The alloy content an alloy surcharge on this grade is charged against. */
export const materialAlloyContentOf = (
  grade: FeaturesQuality | string | null | undefined,
): MaterialAlloyContent | null => materialGradeMeta(grade)?.base.alloy ?? null;

/** Whether a grade is stainless, in any of its families. */
export const isStainlessMaterial = (
  grade: FeaturesQuality | string | null | undefined,
): boolean => {
  const family = materialFamilyOf(grade);
  return (
    family === "stainless_austenitic" ||
    family === "stainless_ferritic" ||
    family === "stainless_martensitic" ||
    family === "stainless_heat_resistant"
  );
};

/**
 * Whether the yard can separate this grade with a magnet. Ferritic and
 * martensitic stainless and every carbon steel are magnetic; austenitic
 * stainless, aluminium and the copper alloys are not.
 */
export const isMagneticMaterial = (
  grade: FeaturesQuality | string | null | undefined,
): boolean => materialGradeMeta(grade)?.base.magnetic ?? false;

/**
 * Whether the surface has to travel under protective foil. A bright, ground,
 * brushed or polished surface is the product; a mill or pickled one is not.
 */
export const materialRequiresProtectiveFoil = (
  grade: FeaturesQuality | string | null | undefined,
): boolean => materialGradeMeta(grade)?.surface.requiresProtectiveFoil ?? false;

/** Which of the three dimensions each cross-section actually uses. */
export const DIMENSION_SHAPE_GEOMETRY: Record<
  ProductDimensionShape,
  DimensionShapeGeometry
> = {
  round: {
    usesLength: true,
    usesWidthDiameter: true,
    usesThickness: false,
    derivable: true,
  },
  square: {
    usesLength: true,
    usesWidthDiameter: true,
    usesThickness: false,
    derivable: true,
  },
  flat: {
    usesLength: true,
    usesWidthDiameter: true,
    usesThickness: true,
    derivable: true,
  },
  rectangular: {
    usesLength: true,
    usesWidthDiameter: true,
    usesThickness: true,
    derivable: true,
  },
  hexagonal: {
    usesLength: true,
    usesWidthDiameter: true,
    usesThickness: false,
    derivable: true,
  },
  octagonal: {
    usesLength: true,
    usesWidthDiameter: true,
    usesThickness: false,
    derivable: true,
  },
  tube_round: {
    usesLength: true,
    usesWidthDiameter: true,
    usesThickness: true,
    derivable: true,
  },
  tube_square: {
    usesLength: true,
    usesWidthDiameter: true,
    usesThickness: true,
    derivable: true,
  },
  tube_rectangular: {
    usesLength: true,
    usesWidthDiameter: true,
    usesThickness: true,
    derivable: true,
  },
  sheet: {
    usesLength: true,
    usesWidthDiameter: true,
    usesThickness: true,
    derivable: true,
  },
  plate: {
    usesLength: true,
    usesWidthDiameter: true,
    usesThickness: true,
    derivable: true,
  },
  // A beam's area comes from its profile table, which this system does not
  // hold, so its weight per metre stays whatever was typed for it.
  beam: {
    usesLength: true,
    usesWidthDiameter: true,
    usesThickness: true,
    derivable: false,
  },
  angle: {
    usesLength: true,
    usesWidthDiameter: true,
    usesThickness: true,
    derivable: true,
  },
};

/**
 * The coarse product shape a group is set up under, expressed as the
 * cross-section its articles are weighed with when the group carries no finer
 * shape of its own. A piece article has no cross-section at all.
 */
export const DIMENSION_SHAPE_FOR_PRODUCT_SHAPE: Record<
  ProductShape,
  ProductDimensionShape | null
> = {
  bar_steel: "round",
  coil: "sheet",
  piece_article: null,
  sheet: "sheet",
  tube: "tube_round",
  beam_steel: "beam",
  profile: "angle",
};

/**
 * The cross-sectional area in mm² a shape has at the given dimensions, or null
 * when the shape is not derivable or a dimension it needs is missing.
 *
 * `tube_rectangular` is treated as a square tube on the width it carries: the
 * article holds one width and one thickness, and inventing the second side
 * would put a wrong weight on the line rather than an absent one.
 */
export const crossSectionAreaMm2 = (
  shape: ProductDimensionShape | null | undefined,
  dimensions: ArticleDimensions,
): number | null => {
  if (!shape || !DIMENSION_SHAPE_GEOMETRY[shape].derivable) {
    return null;
  }
  const width = dimensions.widthDiameter ?? 0;
  const thickness = dimensions.thickness ?? 0;
  if (width <= 0) {
    return null;
  }
  const needsThickness = DIMENSION_SHAPE_GEOMETRY[shape].usesThickness;
  if (needsThickness && thickness <= 0) {
    return null;
  }
  switch (shape) {
    case "round":
      return (Math.PI / 4) * width * width;
    case "square":
      return width * width;
    case "hexagonal":
      return (Math.sqrt(3) / 2) * width * width;
    case "octagonal":
      return 2 * (Math.SQRT2 - 1) * width * width;
    case "tube_round":
      return Math.PI * thickness * (width - thickness);
    case "tube_square":
    case "tube_rectangular":
      return 4 * thickness * (width - thickness);
    case "angle":
      return thickness * (2 * width - thickness);
    default:
      // flat, rectangular, sheet and plate are all width times thickness.
      return width * thickness;
  }
};

/**
 * The paintable outside surface in mm per running metre of the shape — its
 * outer perimeter. Null when the shape has no derivable cross-section.
 */
export const crossSectionPerimeterMm = (
  shape: ProductDimensionShape | null | undefined,
  dimensions: ArticleDimensions,
): number | null => {
  if (!shape || !DIMENSION_SHAPE_GEOMETRY[shape].derivable) {
    return null;
  }
  const width = dimensions.widthDiameter ?? 0;
  const thickness = dimensions.thickness ?? 0;
  if (width <= 0) {
    return null;
  }
  switch (shape) {
    case "round":
    case "tube_round":
      return Math.PI * width;
    case "square":
    case "tube_square":
    case "tube_rectangular":
    case "angle":
      return 4 * width;
    case "hexagonal":
      return 2 * Math.sqrt(3) * width;
    case "octagonal":
      return 8 * Math.tan(Math.PI / 8) * width;
    default:
      // A flat, sheet or plate is painted on both faces plus its two edges.
      return 2 * (width + thickness);
  }
};

/**
 * The kilograms one running metre of this shape weighs in this grade.
 *
 * A cross-section in mm² over a metre is area/1000 dm³, so the weight is the
 * density times that. Null when either the geometry or the density is unknown,
 * which is what keeps a typed-in weight from being overwritten with a guess.
 */
export const weightPerMetreOf = (
  shape: ProductDimensionShape | null | undefined,
  dimensions: ArticleDimensions,
  grade: FeaturesQuality | string | null | undefined,
): number | null => {
  const area = crossSectionAreaMm2(shape, dimensions);
  const density = materialDensityOf(grade);
  if (area === null || density === null) {
    return null;
  }
  return (area * density) / 1000;
};

/** The square metres of paintable surface one running metre carries. */
export const paintSurfacePerMetreOf = (
  shape: ProductDimensionShape | null | undefined,
  dimensions: ArticleDimensions,
): number | null => {
  const perimeter = crossSectionPerimeterMm(shape, dimensions);
  if (perimeter === null) {
    return null;
  }
  return perimeter / 1000;
};

/**
 * The three derived figures an article carries once its shape, its dimensions
 * and its grade are known: weight per metre, paintable surface per metre, and
 * the weight of one piece at its own length.
 *
 * Each is returned only when it is genuinely derivable. A caller keeps whatever
 * was typed for the rest — a beam's weight per metre, or the weight of an
 * article whose grade nobody has picked yet.
 */
export const deriveArticleWeights = (
  shape: ProductDimensionShape | null | undefined,
  dimensions: ArticleDimensions,
  grade: FeaturesQuality | string | null | undefined,
): Partial<DerivedArticleWeights> => {
  const weightPerM1 = weightPerMetreOf(shape, dimensions, grade);
  const paintSurfacePerM1 = paintSurfacePerMetreOf(shape, dimensions);
  const length = dimensions.length ?? 0;
  const derived: Partial<DerivedArticleWeights> = {};
  if (weightPerM1 !== null) {
    derived.weightPerM1 = weightPerM1;
    if (length > 0) {
      derived.weightTheoretical = (weightPerM1 * length) / 1000;
    }
  }
  if (paintSurfacePerM1 !== null) {
    derived.paintSurfacePerM1 = paintSurfacePerM1;
  }
  return derived;
};

/**
 * The same three figures as decimal strings at the scale their columns hold,
 * ready to spread over the fields a product or product group is written with.
 *
 * A figure that cannot be derived is simply absent from the result, which is
 * what lets a caller overwrite a stale weight without wiping the one a person
 * had to type — a beam's weight per metre, say, or an article whose grade
 * nobody has picked yet.
 */
export const derivedWeightColumns = (
  shape: ProductDimensionShape | null | undefined,
  dimensions: ArticleDimensions,
  grade: FeaturesQuality | string | null | undefined,
): Partial<Record<keyof DerivedArticleWeights, string>> => {
  const derived = deriveArticleWeights(shape, dimensions, grade);
  const columns: Partial<Record<keyof DerivedArticleWeights, string>> = {};
  if (derived.weightPerM1 !== undefined) {
    columns.weightPerM1 = derived.weightPerM1.toFixed(4);
  }
  if (derived.paintSurfacePerM1 !== undefined) {
    columns.paintSurfacePerM1 = derived.paintSurfacePerM1.toFixed(4);
  }
  if (derived.weightTheoretical !== undefined) {
    columns.weightTheoretical = derived.weightTheoretical.toFixed(3);
  }
  return columns;
};

// ---------------------------------------------------------------------------
// What a surcharge description means
//
// Every surcharge row carries a rate and an amount, and until now the amount
// was the rate: a project discount of 5 charged five euro instead of taking
// five percent off, and a decoil surcharge of 0.02 charged two cents for the
// whole consignment instead of two cents a kilo. The description already says
// which it is, so it decides the basis, and the amount is computed rather than
// copied.
//
// The description also decides three things nothing else could know: whether it
// adds to the document or comes off it, whether it belongs on a purchase
// document rather than a sales one, and which revenue group it is reported
// under.
// ---------------------------------------------------------------------------

export type SurchargeMeta = {
  /** What the rate is a rate of. */
  basis: SurchargeBasis;
  /** Comes off the document rather than being added to it. */
  deduction: boolean;
  /**
   * Recharges a cost the company itself incurred — bought-in freight, an
   * outsourced cut — so the row is expected to carry a cost of its own and
   * contributes margin rather than pure profit.
   */
  costRecharge: boolean;
  /**
   * Belongs only on a purchase document. These exist to reconcile what a
   * supplier billed against what its lines explain; a customer invoice that
   * carried one would be charging the customer for our own bookkeeping.
   */
  purchaseOnly: boolean;
  /**
   * Carries VAT at the document's own rate. A pure financial adjustment — a
   * rounding difference, a credit note still to be received, a duty already
   * taxed at the border — does not.
   */
  vatable: boolean;
  /** The revenue group the amount is reported under. */
  revenueGroup: RevenueGroup;
};

/** The context a surcharge's basis is measured against. */
export type SurchargeContext = {
  /** Net value of the goods on the document, for a percentage surcharge. */
  goodsValue?: number;
  /** Billed weight, for a per-kilogram surcharge. */
  weightKg?: number;
  /** How many goods lines the document carries. */
  lineCount?: number;
  /** How many pallets the consignment occupies. */
  pallets?: number;
  /** How many certificates the consignment needs. */
  certificates?: number;
};

export const SURCHARGE_META: Record<
  InvoiceSurchargeDescription,
  SurchargeMeta
> = {
  project_discount: {
    basis: "percentage",
    deduction: true,
    costRecharge: false,
    purchaseOnly: false,
    vatable: true,
    revenueGroup: "other_allowances",
  },
  certificate_costs: {
    basis: "per_certificate",
    deduction: false,
    costRecharge: false,
    purchaseOnly: false,
    vatable: true,
    revenueGroup: "other_products",
  },
  cutting_surcharge: {
    basis: "per_line",
    deduction: false,
    costRecharge: true,
    purchaseOnly: false,
    vatable: true,
    revenueGroup: "cutting",
  },
  decoil_surcharge: {
    basis: "per_kg",
    deduction: false,
    costRecharge: true,
    purchaseOnly: false,
    vatable: true,
    revenueGroup: "decoiling",
  },
  order_surcharge: {
    basis: "fixed",
    deduction: false,
    costRecharge: false,
    purchaseOnly: false,
    vatable: true,
    revenueGroup: "other_products",
  },
  packaging_surcharge: {
    basis: "per_line",
    deduction: false,
    costRecharge: true,
    purchaseOnly: false,
    vatable: true,
    revenueGroup: "other_pallets_etc",
  },
  pallet_surcharge: {
    basis: "per_pallet",
    deduction: false,
    costRecharge: true,
    purchaseOnly: false,
    vatable: true,
    revenueGroup: "other_pallets_etc",
  },
  administration_costs: {
    basis: "fixed",
    deduction: false,
    costRecharge: false,
    purchaseOnly: false,
    vatable: true,
    revenueGroup: "other_products",
  },
  transport_costs: {
    basis: "fixed",
    deduction: false,
    costRecharge: true,
    purchaseOnly: false,
    vatable: true,
    revenueGroup: "freight_costs",
  },
  transport_costs_internal: {
    basis: "fixed",
    deduction: false,
    costRecharge: true,
    purchaseOnly: false,
    vatable: true,
    revenueGroup: "freight_costs",
  },
  maut_costs: {
    basis: "fixed",
    deduction: false,
    costRecharge: true,
    purchaseOnly: false,
    vatable: true,
    revenueGroup: "freight_costs",
  },
  return_costs: {
    basis: "fixed",
    deduction: false,
    costRecharge: true,
    purchaseOnly: false,
    vatable: true,
    revenueGroup: "freight_costs",
  },
  import_costs: {
    basis: "percentage",
    deduction: false,
    costRecharge: true,
    purchaseOnly: false,
    vatable: true,
    revenueGroup: "import_costs",
  },
  costs: {
    basis: "fixed",
    deduction: false,
    costRecharge: true,
    purchaseOnly: false,
    vatable: true,
    revenueGroup: "other_products",
  },
  other: {
    basis: "fixed",
    deduction: false,
    costRecharge: false,
    purchaseOnly: false,
    vatable: true,
    revenueGroup: "other_products",
  },
  purchasing_rounding_differences: {
    basis: "fixed",
    deduction: false,
    costRecharge: false,
    purchaseOnly: true,
    vatable: false,
    revenueGroup: "price_differences",
  },
  credit_notes_to_be_received_third_party: {
    basis: "fixed",
    deduction: true,
    costRecharge: false,
    purchaseOnly: true,
    vatable: false,
    revenueGroup: "credit_notes_yet_to_be_received",
  },
  credit_notes_to_be_received: {
    basis: "fixed",
    deduction: true,
    costRecharge: false,
    purchaseOnly: true,
    vatable: false,
    revenueGroup: "credit_notes_yet_to_be_received",
  },
  eu_import_duties: {
    basis: "percentage",
    deduction: false,
    costRecharge: true,
    purchaseOnly: true,
    vatable: false,
    revenueGroup: "eu_import_duties",
  },
  price_differences: {
    basis: "fixed",
    deduction: false,
    costRecharge: false,
    purchaseOnly: true,
    vatable: false,
    revenueGroup: "price_differences",
  },
  price_differences_eu_non_eu: {
    basis: "fixed",
    deduction: false,
    costRecharge: false,
    purchaseOnly: true,
    vatable: false,
    revenueGroup: "price_differences",
  },
  external_transport: {
    basis: "fixed",
    deduction: false,
    costRecharge: true,
    purchaseOnly: false,
    vatable: true,
    revenueGroup: "freight_costs_external",
  },
};

/** What a surcharge description means, or null when the row has none set. */
export const surchargeMetaOf = (
  description: InvoiceSurchargeDescription | null | undefined,
): SurchargeMeta | null => (description ? SURCHARGE_META[description] : null);

/**
 * What a surcharge row actually charges: its rate applied on the basis its
 * description implies, signed negative when the description takes money off.
 *
 * A basis with no context to measure against yields zero rather than a guess —
 * the same rule `computeTransportCost` follows. A description that isn't set
 * yields zero too, because a row nobody has described charges nothing.
 */
export const computeSurchargeAmount = (
  description: InvoiceSurchargeDescription | null | undefined,
  rate: number,
  context: SurchargeContext = {},
): number => {
  const meta = surchargeMetaOf(description);
  if (!meta || !Number.isFinite(rate)) {
    return 0;
  }
  const sign = meta.deduction ? -1 : 1;
  const magnitude = Math.abs(rate);
  if (meta.basis === "fixed") {
    return sign * magnitude;
  }
  if (meta.basis === "percentage") {
    return (sign * magnitude * (context.goodsValue ?? 0)) / 100;
  }
  if (meta.basis === "per_kg") {
    return sign * magnitude * (context.weightKg ?? 0);
  }
  if (meta.basis === "per_line") {
    return sign * magnitude * (context.lineCount ?? 0);
  }
  if (meta.basis === "per_pallet") {
    return sign * magnitude * (context.pallets ?? 0);
  }
  return sign * magnitude * (context.certificates ?? 0);
};

/**
 * Whether a description may appear on a sales document — a quote, an order or a
 * customer invoice. The reconciliation descriptions may not: they exist to
 * explain a supplier's total, and charging one to a customer would bill them
 * for our own bookkeeping.
 */
export const surchargeAllowedOnSales = (
  description: InvoiceSurchargeDescription | null | undefined,
): boolean => !surchargeMetaOf(description)?.purchaseOnly;

/**
 * The surcharge rows of a document with their amounts resolved from their own
 * rates and the document's context, ready to be stored. The rate is left
 * exactly as typed — it is what a person agreed — and only the amount it
 * implies is computed.
 */
export const resolveSurchargeAmounts = <
  T extends {
    description?: InvoiceSurchargeDescription | null;
    surcharge?: string | null;
    amount?: string | null;
  },
>(
  rows: readonly T[],
  context: SurchargeContext,
): T[] =>
  rows.map((row) => ({
    ...row,
    amount: computeSurchargeAmount(
      row.description,
      Number(row.surcharge ?? 0),
      context,
    ).toFixed(2),
  }));

// ---------------------------------------------------------------------------
// What a revenue group and an article group mean
//
// A revenue group was a name on a dropdown, which left every revenue report
// adding trading revenue, a freight recharge and a price difference into one
// column and printing a margin on the total. Each group now says what it is,
// which side of the ledger it belongs on, and whether it counts toward the
// material margin at all.
//
// The material groups also say which metal they are for, which is what lets a
// grade choose its own revenue group instead of somebody remembering that 316L
// belongs under SS 316. An article group says the same thing one level up: the
// codes carry a metal, a shape and sometimes a thickness, and every article in
// the group rolls into the same revenue group.
// ---------------------------------------------------------------------------

export type RevenueGroupMeta = {
  kind: RevenueGroupKind;
  /** Which side of the two statements this group lands on. */
  ledgerAccountType: LedgerAccountType;
  /**
   * Counts toward the material margin. Only traded metal does: a freight
   * recharge, an allowance and a price difference all move the total without
   * being anything a margin can be earned on.
   */
  countsTowardMaterialMargin: boolean;
  /** Reduces revenue rather than adding to it. */
  deduction: boolean;
  /**
   * The metal this group is for, where it is a material group. Null for the
   * processing, freight and adjustment groups, which are not about a metal.
   */
  materialFamily: MaterialFamily | null;
};

export type ArticleGroupMeta = {
  materialFamily: MaterialFamily;
  /** The shape every article in the group is made in. */
  shape: ProductShape;
  /**
   * The nominal thickness in millimetres the code carries, where it carries
   * one — PTA2,5 is 2.5 mm. Null where the code says nothing about thickness.
   */
  nominalThicknessMm: number | null;
  /** The revenue group every article in this group rolls into. */
  revenueGroup: RevenueGroup;
};

export const REVENUE_GROUP_META: Record<RevenueGroup, RevenueGroupMeta> = {
  ss_304: {
    kind: "material",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: true,
    deduction: false,
    materialFamily: "stainless_austenitic",
  },
  ss_316: {
    kind: "material",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: true,
    deduction: false,
    materialFamily: "stainless_austenitic",
  },
  ss_321: {
    kind: "material",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: true,
    deduction: false,
    materialFamily: "stainless_austenitic",
  },
  ss_430: {
    kind: "material",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: true,
    deduction: false,
    materialFamily: "stainless_ferritic",
  },
  high_alloys: {
    kind: "material",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: true,
    deduction: false,
    materialFamily: "stainless_heat_resistant",
  },
  aluminium: {
    kind: "material",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: true,
    deduction: false,
    materialFamily: "aluminium",
  },
  steel: {
    kind: "material",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: true,
    deduction: false,
    materialFamily: "carbon_steel",
  },
  // The webshop's own revenue line. It sells the same metal, but it is reported
  // apart from the trade counter because it is a different channel.
  roestvast_nl: {
    kind: "material",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: true,
    deduction: false,
    materialFamily: "stainless_austenitic",
  },
  foil_consumption_and_sales: {
    kind: "processing",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: false,
    deduction: false,
    materialFamily: null,
  },
  // Offcuts and scrap sold on. Metal, but not at a trading margin — it is what
  // is left rather than what was bought to sell.
  sales_residual_material: {
    kind: "other",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: false,
    deduction: false,
    materialFamily: null,
  },
  other_pallets_etc: {
    kind: "other",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: false,
    deduction: false,
    materialFamily: null,
  },
  other_products: {
    kind: "other",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: false,
    deduction: false,
    materialFamily: null,
  },
  decoiling: {
    kind: "processing",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: false,
    deduction: false,
    materialFamily: null,
  },
  grinding_foiling: {
    kind: "processing",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: false,
    deduction: false,
    materialFamily: null,
  },
  cutting: {
    kind: "processing",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: false,
    deduction: false,
    materialFamily: null,
  },
  lasering: {
    kind: "processing",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: false,
    deduction: false,
    materialFamily: null,
  },
  other_processing: {
    kind: "processing",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: false,
    deduction: false,
    materialFamily: null,
  },
  freight_costs: {
    kind: "freight",
    ledgerAccountType: "expense",
    countsTowardMaterialMargin: false,
    deduction: false,
    materialFamily: null,
  },
  freight_costs_external: {
    kind: "freight",
    ledgerAccountType: "expense",
    countsTowardMaterialMargin: false,
    deduction: false,
    materialFamily: null,
  },
  credit_notes_yet_to_be_received: {
    kind: "adjustment",
    ledgerAccountType: "asset",
    countsTowardMaterialMargin: false,
    deduction: true,
    materialFamily: null,
  },
  vat_credit_restriction_creditor: {
    kind: "adjustment",
    ledgerAccountType: "liability",
    countsTowardMaterialMargin: false,
    deduction: false,
    materialFamily: null,
  },
  price_differences: {
    kind: "adjustment",
    ledgerAccountType: "expense",
    countsTowardMaterialMargin: false,
    deduction: false,
    materialFamily: null,
  },
  other_allowances: {
    kind: "allowance",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: false,
    deduction: true,
    materialFamily: null,
  },
  eu_import_duties: {
    kind: "adjustment",
    ledgerAccountType: "expense",
    countsTowardMaterialMargin: false,
    deduction: false,
    materialFamily: null,
  },
  // Reports the spread between Asian and European material, which is a
  // comparison of two material revenues rather than a revenue of its own.
  revenue_asia_vs_eu_material: {
    kind: "adjustment",
    ledgerAccountType: "revenue",
    countsTowardMaterialMargin: false,
    deduction: false,
    materialFamily: null,
  },
  import_costs: {
    kind: "adjustment",
    ledgerAccountType: "expense",
    countsTowardMaterialMargin: false,
    deduction: false,
    materialFamily: null,
  },
};

/**
 * The article groups. `CK` is coil, `PW` and `PK` are sheet, `PTA` is a
 * thickness-graded sheet, and `PDIVA` is the mixed group everything that fits
 * no other lands in.
 */
export const ARTICLE_GROUP_META: Record<ArticleGroup, ArticleGroupMeta> = {
  ck304: {
    materialFamily: "stainless_austenitic",
    shape: "coil",
    nominalThicknessMm: null,
    revenueGroup: "ss_304",
  },
  ck316: {
    materialFamily: "stainless_austenitic",
    shape: "coil",
    nominalThicknessMm: null,
    revenueGroup: "ss_316",
  },
  ck430: {
    materialFamily: "stainless_ferritic",
    shape: "coil",
    nominalThicknessMm: null,
    revenueGroup: "ss_430",
  },
  ckm304: {
    materialFamily: "stainless_austenitic",
    shape: "coil",
    nominalThicknessMm: null,
    revenueGroup: "ss_304",
  },
  pdiva: {
    materialFamily: "stainless_austenitic",
    shape: "piece_article",
    nominalThicknessMm: null,
    revenueGroup: "other_products",
  },
  pk304: {
    materialFamily: "stainless_austenitic",
    shape: "sheet",
    nominalThicknessMm: null,
    revenueGroup: "ss_304",
  },
  pta2_5: {
    materialFamily: "stainless_austenitic",
    shape: "sheet",
    nominalThicknessMm: 2.5,
    revenueGroup: "ss_304",
  },
  pta3: {
    materialFamily: "stainless_austenitic",
    shape: "sheet",
    nominalThicknessMm: 3,
    revenueGroup: "ss_304",
  },
  pta3_5: {
    materialFamily: "stainless_austenitic",
    shape: "sheet",
    nominalThicknessMm: 3.5,
    revenueGroup: "ss_304",
  },
  pta5: {
    materialFamily: "stainless_austenitic",
    shape: "sheet",
    nominalThicknessMm: 5,
    revenueGroup: "ss_304",
  },
  pw304: {
    materialFamily: "stainless_austenitic",
    shape: "sheet",
    nominalThicknessMm: null,
    revenueGroup: "ss_304",
  },
  pw316: {
    materialFamily: "stainless_austenitic",
    shape: "sheet",
    nominalThicknessMm: null,
    revenueGroup: "ss_316",
  },
  pw430: {
    materialFamily: "stainless_ferritic",
    shape: "sheet",
    nominalThicknessMm: null,
    revenueGroup: "ss_430",
  },
};

/** What a revenue group is, or null when a row carries none. */
export const revenueGroupMetaOf = (
  group: RevenueGroup | null | undefined,
): RevenueGroupMeta | null => (group ? REVENUE_GROUP_META[group] : null);

/** What an article group implies, or null when a row carries none. */
export const articleGroupMetaOf = (
  group: ArticleGroup | null | undefined,
): ArticleGroupMeta | null => (group ? ARTICLE_GROUP_META[group] : null);

/**
 * The revenue group a grade belongs under, read off the grade itself. The four
 * stainless groups are named after a base grade, so a 316 in any finish reports
 * under SS 316; the heat-resistant grades go to high alloys, and everything
 * outside stainless and aluminium to steel.
 *
 * Null when no grade is set, because an article nobody has graded has no
 * revenue group to be defaulted to.
 */
export const revenueGroupForMaterialGrade = (
  grade: FeaturesQuality | string | null | undefined,
): RevenueGroup | null => {
  const meta = materialGradeMeta(grade);
  if (!meta) {
    return null;
  }
  // The heat-resistant grades are austenitic too and their codes start with
  // 309/310, so they have to be taken out before the 30x test below.
  if (meta.base.family === "stainless_heat_resistant") {
    return "high_alloys";
  }
  const base = meta.base.code;
  if (base.startsWith("316")) {
    return "ss_316";
  }
  if (base.startsWith("321")) {
    return "ss_321";
  }
  if (meta.base.family === "stainless_austenitic") {
    return "ss_304";
  }
  if (
    meta.base.family === "stainless_ferritic" ||
    meta.base.family === "stainless_martensitic"
  ) {
    return "ss_430";
  }
  if (meta.base.family === "aluminium") {
    return "aluminium";
  }
  if (
    meta.base.family === "brass" ||
    meta.base.family === "bronze" ||
    meta.base.family === "copper"
  ) {
    return "other_products";
  }
  return "steel";
};

/**
 * A stored revenue-group row matched back to the group it is one of, by name.
 *
 * The reports read the RevenueGroups table, whose rows are named by hand, so
 * this is the only join available between what a report groups by and what the
 * group means. A name nobody recognises returns null and is reported as
 * unclassified rather than being pushed into a kind it may not belong to.
 */
export const revenueGroupFromName = (
  name: string | null | undefined,
): RevenueGroup | null => {
  if (!name) {
    return null;
  }
  const wanted = name.trim().toLowerCase();
  const match = revenueGroups.find(
    (group) => REVENUE_GROUP_LABELS[group].toLowerCase() === wanted,
  );
  return match ?? null;
};

/**
 * The kind a stored revenue-group name reports under. `null` name, unmatched
 * name, or a group nobody classified all read as "other", which is the kind
 * that claims nothing about the figures beneath it.
 */
export const revenueGroupKindFromName = (
  name: string | null | undefined,
): RevenueGroupKind =>
  revenueGroupMetaOf(revenueGroupFromName(name))?.kind ?? "other";

// ---------------------------------------------------------------------------
// What a machine can do, and what a processing step needs
//
// A machine carried an option and a production line as two free choices, so a
// decoiler could be set up to run a laser and nothing objected. A production
// line performs a known set of options and no others, and that is what decides
// which machine a job can be planned onto.
//
// The option also decides how the machine measures its day — a laser in cutting
// metres, a grinder in square metres, a decoiler in kilos — and whether the run
// changes the goods in a way the rest of the system has to know about: material
// cut away, foil applied or stripped, a surface changed so the finish the grade
// names no longer describes it.
//
// The processing vocabulary sold to customers is the same list plus three steps
// no machine performs: paper interleaving and the two certificates. Mapping the
// two is what lets an order line's sold options choose the machine that has to
// run them.
// ---------------------------------------------------------------------------

export type MachineOptionMeta = {
  /** The unit a machine running this option measures its daily capacity in. */
  capacityUnit: MachineCapacityUnit;
  /**
   * Material is cut away, so what leaves the machine weighs less than what went
   * in. Only the cutting family loses enough for a yield check to care.
   */
  removesMaterial: boolean;
  /** Applies protective foil, which is consumed by the run. */
  consumesFoil: boolean;
  /** Strips protective foil off. */
  removesFoil: boolean;
  /**
   * Changes the surface itself, so the finish the material's grade names no
   * longer describes what comes out.
   */
  surfaceTreatment: boolean;
  /** Minutes lost setting the machine up before the run starts. */
  setupMinutes: number;
};

export type MachineProductionMeta = {
  /** The options this production line can run, and no others. */
  performs: readonly MachineOptionType[];
  /** What a line of this kind measures its day in when nobody says otherwise. */
  defaultCapacityUnit: MachineCapacityUnit;
};

export const MACHINE_OPTION_META: Record<MachineOptionType, MachineOptionMeta> =
  {
    decoiling: {
      capacityUnit: "kg",
      removesMaterial: false,
      consumesFoil: false,
      removesFoil: false,
      surfaceTreatment: false,
      setupMinutes: 45,
    },
    grinding: {
      capacityUnit: "m2",
      removesMaterial: false,
      consumesFoil: false,
      removesFoil: false,
      surfaceTreatment: true,
      setupMinutes: 20,
    },
    shear_cut: {
      capacityUnit: "line",
      removesMaterial: true,
      consumesFoil: false,
      removesFoil: false,
      surfaceTreatment: false,
      setupMinutes: 15,
    },
    laser: {
      capacityUnit: "m1",
      removesMaterial: true,
      consumesFoil: false,
      removesFoil: false,
      surfaceTreatment: false,
      setupMinutes: 30,
    },
    duplo: {
      capacityUnit: "st",
      removesMaterial: false,
      consumesFoil: false,
      removesFoil: false,
      surfaceTreatment: false,
      setupMinutes: 15,
    },
    brushing: {
      capacityUnit: "m2",
      removesMaterial: false,
      consumesFoil: false,
      removesFoil: false,
      surfaceTreatment: true,
      setupMinutes: 20,
    },
    blue_foil: {
      capacityUnit: "m2",
      removesMaterial: false,
      consumesFoil: true,
      removesFoil: false,
      surfaceTreatment: false,
      setupMinutes: 10,
    },
    laser_foil: {
      capacityUnit: "m2",
      removesMaterial: false,
      consumesFoil: true,
      removesFoil: false,
      surfaceTreatment: false,
      setupMinutes: 10,
    },
    uv_foil: {
      capacityUnit: "m2",
      removesMaterial: false,
      consumesFoil: true,
      removesFoil: false,
      surfaceTreatment: false,
      setupMinutes: 10,
    },
    remove_foil: {
      capacityUnit: "m2",
      removesMaterial: false,
      consumesFoil: false,
      removesFoil: true,
      surfaceTreatment: false,
      setupMinutes: 5,
    },
    anodizing: {
      capacityUnit: "m2",
      removesMaterial: false,
      consumesFoil: false,
      removesFoil: false,
      surfaceTreatment: true,
      setupMinutes: 60,
    },
    pickling: {
      capacityUnit: "m2",
      removesMaterial: false,
      consumesFoil: false,
      removesFoil: false,
      surfaceTreatment: true,
      setupMinutes: 60,
    },
    coating: {
      capacityUnit: "m2",
      removesMaterial: false,
      consumesFoil: false,
      removesFoil: false,
      surfaceTreatment: true,
      setupMinutes: 60,
    },
    embossing: {
      capacityUnit: "m2",
      removesMaterial: false,
      consumesFoil: false,
      removesFoil: false,
      surfaceTreatment: true,
      setupMinutes: 30,
    },
    perforate: {
      capacityUnit: "m2",
      removesMaterial: true,
      consumesFoil: false,
      removesFoil: false,
      surfaceTreatment: false,
      setupMinutes: 30,
    },
    bending: {
      capacityUnit: "line",
      removesMaterial: false,
      consumesFoil: false,
      removesFoil: false,
      surfaceTreatment: false,
      setupMinutes: 20,
    },
    polished: {
      capacityUnit: "m2",
      removesMaterial: false,
      consumesFoil: false,
      removesFoil: false,
      surfaceTreatment: true,
      setupMinutes: 25,
    },
    punching: {
      capacityUnit: "st",
      removesMaterial: true,
      consumesFoil: false,
      removesFoil: false,
      surfaceTreatment: false,
      setupMinutes: 20,
    },
    slitting: {
      capacityUnit: "kg",
      removesMaterial: true,
      consumesFoil: false,
      removesFoil: false,
      surfaceTreatment: false,
      setupMinutes: 40,
    },
    rolling: {
      capacityUnit: "kg",
      removesMaterial: false,
      consumesFoil: false,
      removesFoil: false,
      surfaceTreatment: false,
      setupMinutes: 30,
    },
    stamping: {
      capacityUnit: "st",
      removesMaterial: false,
      consumesFoil: false,
      removesFoil: false,
      surfaceTreatment: false,
      setupMinutes: 25,
    },
    sawing: {
      capacityUnit: "st",
      removesMaterial: true,
      consumesFoil: false,
      removesFoil: false,
      surfaceTreatment: false,
      setupMinutes: 15,
    },
  };

export const MACHINE_PRODUCTION_META: Record<
  MachineProductionType,
  MachineProductionMeta
> = {
  decoiler: {
    performs: ["decoiling", "slitting"],
    defaultCapacityUnit: "kg",
  },
  shearing: {
    performs: ["shear_cut"],
    defaultCapacityUnit: "line",
  },
  laser_1: {
    performs: ["laser"],
    defaultCapacityUnit: "m1",
  },
  laser_2: {
    performs: ["laser"],
    defaultCapacityUnit: "m1",
  },
  grinding_foiling: {
    performs: [
      "grinding",
      "brushing",
      "polished",
      "blue_foil",
      "laser_foil",
      "uv_foil",
      "remove_foil",
    ],
    defaultCapacityUnit: "m2",
  },
  // The general shop: everything the specialised lines above do not do.
  internal_processing: {
    performs: [
      "duplo",
      "anodizing",
      "pickling",
      "coating",
      "embossing",
      "perforate",
      "bending",
      "punching",
      "rolling",
      "stamping",
      "sawing",
    ],
    defaultCapacityUnit: "st",
  },
};

/**
 * The machine option a sold processing step needs. Paper interleaving and the
 * two certificates are steps no machine performs — they are a packing
 * instruction and two documents — so they map to nothing rather than to a
 * pretend option.
 */
export const MACHINE_OPTION_FOR_PROCESSING: Record<
  ProcessingEditing,
  MachineOptionType | null
> = {
  stamping: "stamping",
  polished: "polished",
  paper_interleaving: null,
  pickling: "pickling",
  laser: "laser",
  blue_foil: "blue_foil",
  bending: "bending",
  uv_foil: "uv_foil",
  rolling: "rolling",
  anodizing: "anodizing",
  slitting: "slitting",
  brushing: "brushing",
  remove_foil: "remove_foil",
  certificate_2_1: null,
  sawing: "sawing",
  coating: "coating",
  punching: "punching",
  grinding: "grinding",
  decoiling: "decoiling",
  duplo: "duplo",
  embossing: "embossing",
  shear_cut: "shear_cut",
  laser_foil: "laser_foil",
  perforate: "perforate",
  certificate_3_1: null,
};

/** What running an option involves, or null when a row carries none. */
export const machineOptionMetaOf = (
  option: MachineOptionType | null | undefined,
): MachineOptionMeta | null => (option ? MACHINE_OPTION_META[option] : null);

/** Whether a production line can run a given option at all. */
export const canMachinePerform = (
  production: MachineProductionType | null | undefined,
  option: MachineOptionType | null | undefined,
): boolean => {
  if (!production || !option) {
    return false;
  }
  return MACHINE_PRODUCTION_META[production].performs.includes(option);
};

/** The production lines able to run an option. */
export const productionTypesForOption = (
  option: MachineOptionType | null | undefined,
): MachineProductionType[] => {
  if (!option) {
    return [];
  }
  return machineProductionTypes.filter((production) =>
    MACHINE_PRODUCTION_META[production].performs.includes(option),
  );
};

/**
 * The capacity unit a machine should measure its day in: the one the option it
 * runs is measured in, falling back to what its production line uses.
 */
export const machineCapacityUnitFor = (
  option: MachineOptionType | null | undefined,
  production: MachineProductionType | null | undefined,
): MachineCapacityUnit | null => {
  const fromOption = machineOptionMetaOf(option)?.capacityUnit;
  if (fromOption) {
    return fromOption;
  }
  return production
    ? MACHINE_PRODUCTION_META[production].defaultCapacityUnit
    : null;
};

/**
 * The machine option a sold processing step needs, or null when the step needs
 * no machine at all.
 */
export const machineOptionForProcessing = (
  editing: ProcessingEditing | null | undefined,
): MachineOptionType | null =>
  editing ? MACHINE_OPTION_FOR_PROCESSING[editing] : null;

// ---------------------------------------------------------------------------
// Transport regions and modes
//
// A region and a mode of transport were two dropdowns nothing read, which is
// why the CBS/Intrastat export had no transport code to declare and no way to
// say whether a consignment left the customs union.
//
// The mode is not a house list: it is the Intrastat mode-of-transport code
// list, and the numbers matter — a statutory return declares 1 for sea, 3 for
// road, 4 for air. The region decides how long the journey takes, whether
// customs paperwork is needed at all, and how much further the freight has to
// travel than a domestic delivery.
// ---------------------------------------------------------------------------

export type TransportModeMeta = {
  /** The Intrastat mode-of-transport code a statutory return declares. */
  cbsCode: number;
  /**
   * Payload one consignment can carry, in kilograms. Null where the mode has no
   * practical limit at this scale — a ship, a barge, a pipeline — or where the
   * goods carry themselves.
   */
  maxPayloadKg: number | null;
  /**
   * How much longer this mode takes than the road journey the region's transit
   * time is quoted for. Air is faster, sea very much slower.
   */
  transitDayFactor: number;
  /** The consignment note this mode travels under, where it has a named one. */
  consignmentNote: "cmr" | "bill_of_lading" | "air_waybill" | "cim" | null;
};

export type TransportRegionMeta = {
  /** The company's own country: no border, no customs, shortest journey. */
  domestic: boolean;
  /**
   * Inside the EU customs union, so goods move without an export declaration.
   * The UK is outside it since Brexit, and "Eastern Europe" here is the
   * non-member part of it — the Baltic states have their own region.
   */
  inEuCustomsUnion: boolean;
  /** Road transit time in working days from the warehouse. */
  roadTransitDays: number;
  /** The mode a consignment to this region goes by unless told otherwise. */
  defaultMode: TransportMode;
  /**
   * How much more the freight costs than a domestic delivery, as a percentage
   * on top of the transporter's rate.
   */
  freightSurchargePercent: number;
};

export const TRANSPORT_MODE_META: Record<TransportMode, TransportModeMeta> = {
  sea_transport: {
    cbsCode: 1,
    maxPayloadKg: null,
    transitDayFactor: 6,
    consignmentNote: "bill_of_lading",
  },
  rail_transport: {
    cbsCode: 2,
    maxPayloadKg: 60000,
    transitDayFactor: 1.5,
    consignmentNote: "cim",
  },
  road_transport: {
    cbsCode: 3,
    maxPayloadKg: 24000,
    transitDayFactor: 1,
    consignmentNote: "cmr",
  },
  air_transport: {
    cbsCode: 4,
    maxPayloadKg: 5000,
    transitDayFactor: 0.25,
    consignmentNote: "air_waybill",
  },
  postal_shipments: {
    cbsCode: 5,
    maxPayloadKg: 30,
    transitDayFactor: 2,
    consignmentNote: null,
  },
  fixed_transport_facilities: {
    cbsCode: 7,
    maxPayloadKg: null,
    transitDayFactor: 1,
    consignmentNote: null,
  },
  inland_waterway_transport: {
    cbsCode: 8,
    maxPayloadKg: null,
    transitDayFactor: 3,
    consignmentNote: "bill_of_lading",
  },
  // The goods move under their own power — a vehicle driven away. Nothing
  // carries it, so there is no payload and no transit to plan.
  own_power: {
    cbsCode: 9,
    maxPayloadKg: null,
    transitDayFactor: 0,
    consignmentNote: null,
  },
};

export const TRANSPORT_REGION_META: Record<
  WarehouseTransportRegion,
  TransportRegionMeta
> = {
  ned: {
    domestic: true,
    inEuCustomsUnion: true,
    roadTransitDays: 1,
    defaultMode: "road_transport",
    freightSurchargePercent: 0,
  },
  bel: {
    domestic: false,
    inEuCustomsUnion: true,
    roadTransitDays: 1,
    defaultMode: "road_transport",
    freightSurchargePercent: 5,
  },
  lux: {
    domestic: false,
    inEuCustomsUnion: true,
    roadTransitDays: 2,
    defaultMode: "road_transport",
    freightSurchargePercent: 8,
  },
  dui: {
    domestic: false,
    inEuCustomsUnion: true,
    roadTransitDays: 2,
    defaultMode: "road_transport",
    freightSurchargePercent: 10,
  },
  fra: {
    domestic: false,
    inEuCustomsUnion: true,
    roadTransitDays: 3,
    defaultMode: "road_transport",
    freightSurchargePercent: 15,
  },
  ita: {
    domestic: false,
    inEuCustomsUnion: true,
    roadTransitDays: 4,
    defaultMode: "road_transport",
    freightSurchargePercent: 25,
  },
  sp_po: {
    domestic: false,
    inEuCustomsUnion: true,
    roadTransitDays: 5,
    defaultMode: "road_transport",
    freightSurchargePercent: 30,
  },
  bal: {
    domestic: false,
    inEuCustomsUnion: true,
    roadTransitDays: 5,
    defaultMode: "road_transport",
    freightSurchargePercent: 30,
  },
  oe: {
    domestic: false,
    inEuCustomsUnion: false,
    roadTransitDays: 5,
    defaultMode: "road_transport",
    freightSurchargePercent: 30,
  },
  eng: {
    domestic: false,
    inEuCustomsUnion: false,
    roadTransitDays: 4,
    defaultMode: "road_transport",
    freightSurchargePercent: 20,
  },
  azie: {
    domestic: false,
    inEuCustomsUnion: false,
    roadTransitDays: 6,
    defaultMode: "sea_transport",
    freightSurchargePercent: 100,
  },
  zd_am: {
    domestic: false,
    inEuCustomsUnion: false,
    roadTransitDays: 5,
    defaultMode: "sea_transport",
    freightSurchargePercent: 90,
  },
};

/** What a mode of transport implies, or null when a document names none. */
export const transportModeMetaOf = (
  mode: TransportMode | null | undefined,
): TransportModeMeta | null => (mode ? TRANSPORT_MODE_META[mode] : null);

/** What a transport region implies, or null when a document names none. */
export const transportRegionMetaOf = (
  region: WarehouseTransportRegion | null | undefined,
): TransportRegionMeta | null =>
  region ? TRANSPORT_REGION_META[region] : null;

/**
 * The Intrastat mode-of-transport code to declare, or null when the document
 * does not say how the goods travelled. A statutory return cannot guess.
 */
export const transportModeCbsCode = (
  mode: TransportMode | null | undefined,
): number | null => transportModeMetaOf(mode)?.cbsCode ?? null;

/**
 * Whether a consignment to this region needs export paperwork. Inside the
 * customs union it does not; a region nobody set is treated as needing none,
 * since an unrecorded destination is far more likely to be a local delivery
 * than an export.
 */
export const requiresCustomsDocuments = (
  region: WarehouseTransportRegion | null | undefined,
): boolean => {
  const meta = transportRegionMetaOf(region);
  return meta ? !meta.inEuCustomsUnion : false;
};

/** The mode a consignment to a region goes by unless a person says otherwise. */
export const defaultTransportModeFor = (
  region: WarehouseTransportRegion | null | undefined,
): TransportMode | null => transportRegionMetaOf(region)?.defaultMode ?? null;

/**
 * Working days in transit for a region by a given mode: the region's road time
 * stretched or shortened by the mode. Null when the region is unknown, because
 * there is nothing to base a promise on. Goods moving under their own power
 * arrive the same day.
 */
export const estimatedTransitDays = (
  region: WarehouseTransportRegion | null | undefined,
  mode: TransportMode | null | undefined,
): number | null => {
  const regionMeta = transportRegionMetaOf(region);
  if (!regionMeta) {
    return null;
  }
  const modeMeta =
    transportModeMetaOf(mode) ?? TRANSPORT_MODE_META[regionMeta.defaultMode];
  return Math.ceil(regionMeta.roadTransitDays * modeMeta.transitDayFactor);
};

/**
 * The freight rate for a region: the transporter's own cost with the region's
 * distance surcharge on top. A region nobody set carries no surcharge.
 */
export const freightCostForRegion = (
  baseCost: number,
  region: WarehouseTransportRegion | null | undefined,
): number => {
  const surcharge = transportRegionMetaOf(region)?.freightSurchargePercent ?? 0;
  return baseCost * (1 + surcharge / 100);
};

/**
 * How many consignments a load needs by a given mode. One, where the mode has
 * no practical payload limit; otherwise the load divided by what one carries.
 * A load of nothing needs no transport at all.
 */
export const consignmentsNeeded = (
  mode: TransportMode | null | undefined,
  weightKg: number,
): number => {
  if (weightKg <= 0) {
    return 0;
  }
  const payload = transportModeMetaOf(mode)?.maxPayloadKg;
  if (!payload) {
    return 1;
  }
  return Math.ceil(weightKg / payload);
};

/**
 * A stored free-text transport mode read back as one of the modes, or null when
 * it is blank or something nobody recognises. The sales and purchase order
 * headers hold these as varchars, so they have to be narrowed before the
 * metadata above can be asked anything.
 */
export const asTransportMode = (
  value: string | null | undefined,
): TransportMode | null => {
  const found = transportModes.find((mode) => mode === value);
  return found ?? null;
};

/** The same for a stored free-text transport region. */
export const asTransportRegion = (
  value: string | null | undefined,
): WarehouseTransportRegion | null => {
  const found = warehouseTransportRegions.find((region) => region === value);
  return found ?? null;
};

// ---------------------------------------------------------------------------
// What a location type means
//
// A location's type was recorded and never consulted, so a lot standing on the
// scrap heap, waiting at the inspection bench or already staged at the loading
// bay was offered to a sales order exactly like a lot on a pick face. The type
// is the only thing that says what state the goods are in.
//
// Each type answers four questions: does it hold stock at all, may a sales
// order draw from it, does a picker walk to it, and is it counted. A type whose
// stock is not sellable also says why, which is the block reason a lot standing
// there carries.
//
// The work-order line types are the moves between them. A line type says where
// the goods come from and where they go, which is what makes "transfer" and
// "put away" different operations rather than two words for the same one.
// ---------------------------------------------------------------------------

export type WarehouseLocationTypeMeta = {
  /** Holds stock that counts as on hand. */
  holdsStock: boolean;
  /** A sales order may draw from a lot standing here. */
  sellable: boolean;
  /** A picker walks to it on a picking round. */
  pickable: boolean;
  /** Stock here is counted on the periodic count. */
  countable: boolean;
  /** Goods here are on their way somewhere rather than at rest. */
  inTransit: boolean;
  /**
   * Why a lot standing here is not sellable. Null for the types whose stock is
   * sellable, since there is nothing to explain.
   */
  blockReason: WarehouseBlockReason | null;
};

export type WarehouseWorkOrderLineTypeMeta = {
  /** Where the goods come from; null means from outside the warehouse. */
  from: WarehouseLocationType | null;
  /** Where they go; null means out of the warehouse. */
  to: WarehouseLocationType | null;
  /** What the line does to the warehouse's stock. */
  stockEffect: "in" | "out" | "move";
  /** The line is closed by scanning, not by typing. */
  requiresScan: boolean;
};

export const WAREHOUSE_LOCATION_TYPE_META: Record<
  WarehouseLocationType,
  WarehouseLocationTypeMeta
> = {
  pick: {
    holdsStock: true,
    sellable: true,
    pickable: true,
    countable: true,
    inTransit: false,
    blockReason: null,
  },
  // Bulk replenishes the pick face rather than being walked to itself, but the
  // goods are ours and sellable.
  bulk: {
    holdsStock: true,
    sellable: true,
    pickable: false,
    countable: true,
    inTransit: false,
    blockReason: null,
  },
  // Received and not yet shelved. Still sellable — it is our stock, standing in
  // the wrong place.
  put_away: {
    holdsStock: true,
    sellable: true,
    pickable: false,
    countable: true,
    inTransit: true,
    blockReason: null,
  },
  production: {
    holdsStock: true,
    sellable: false,
    pickable: false,
    countable: true,
    inTransit: true,
    blockReason: "location_type_setting",
  },
  processing: {
    holdsStock: true,
    sellable: false,
    pickable: false,
    countable: true,
    inTransit: true,
    blockReason: "location_type_setting",
  },
  sorting: {
    holdsStock: true,
    sellable: false,
    pickable: false,
    countable: true,
    inTransit: true,
    blockReason: "location_type_setting",
  },
  // Goods waiting for a verdict. Not sellable until they pass.
  inspection: {
    holdsStock: true,
    sellable: false,
    pickable: false,
    countable: true,
    inTransit: false,
    blockReason: "disapproval",
  },
  // Staged for a truck: already picked for somebody, so not free to sell again.
  load: {
    holdsStock: true,
    sellable: false,
    pickable: false,
    countable: false,
    inTransit: true,
    blockReason: "location_type_setting",
  },
  // Waiting for the customer to collect it — picked, and theirs.
  collection: {
    holdsStock: true,
    sellable: false,
    pickable: false,
    countable: false,
    inTransit: true,
    blockReason: "location_type_setting",
  },
  // Held against a call-off contract, so it belongs to that customer's
  // agreement rather than to the free stock.
  call_off: {
    holdsStock: true,
    sellable: false,
    pickable: false,
    countable: true,
    inTransit: false,
    blockReason: "reserved_for_customer",
  },
  // Waste. It is still physically there, which is why it holds stock, but it is
  // not sellable and there is nothing to count.
  scrap: {
    holdsStock: true,
    sellable: false,
    pickable: false,
    countable: false,
    inTransit: false,
    blockReason: "location_type_setting",
  },
};

export const WAREHOUSE_WORK_ORDER_LINE_TYPE_META: Record<
  WarehouseWorkOrderLineType,
  WarehouseWorkOrderLineTypeMeta
> = {
  unloading: {
    from: null,
    to: "put_away",
    stockEffect: "in",
    requiresScan: true,
  },
  put_away: {
    from: "put_away",
    to: "bulk",
    stockEffect: "move",
    requiresScan: true,
  },
  transfer: {
    from: "bulk",
    to: "pick",
    stockEffect: "move",
    requiresScan: true,
  },
  picking: {
    from: "pick",
    to: "load",
    stockEffect: "move",
    requiresScan: true,
  },
  processing: {
    from: "pick",
    to: "processing",
    stockEffect: "move",
    requiresScan: true,
  },
  inspection: {
    from: "put_away",
    to: "inspection",
    stockEffect: "move",
    requiresScan: false,
  },
  loading: {
    from: "load",
    to: null,
    stockEffect: "out",
    requiresScan: true,
  },
};

/** What a location type means, or null when a location carries none. */
export const warehouseLocationTypeMetaOf = (
  type: WarehouseLocationType | null | undefined,
): WarehouseLocationTypeMeta | null =>
  type ? WAREHOUSE_LOCATION_TYPE_META[type] : null;

/** The location types a sales order may draw stock from. */
export const SELLABLE_LOCATION_TYPES: WarehouseLocationType[] =
  warehouseLocationTypes.filter(
    (type) => WAREHOUSE_LOCATION_TYPE_META[type].sellable,
  );

/**
 * The location types whose stock is not free to sell. A lot standing on one of
 * these is spoken for, on its way somewhere, or waiting for a verdict.
 */
export const NON_SELLABLE_LOCATION_TYPES: WarehouseLocationType[] =
  warehouseLocationTypes.filter(
    (type) => !WAREHOUSE_LOCATION_TYPE_META[type].sellable,
  );

/**
 * Whether a sales order may draw from a lot standing on this type of location.
 *
 * A location with no type recorded is treated as sellable: the great majority
 * of locations are ordinary shelves, and refusing to sell from every location
 * nobody has classified would empty the warehouse on paper.
 */
export const isSellableLocationType = (
  type: WarehouseLocationType | null | undefined,
): boolean => (type ? WAREHOUSE_LOCATION_TYPE_META[type].sellable : true);

/**
 * Why a lot standing on this type of location is blocked, or null when it is
 * not blocked at all.
 */
export const blockReasonForLocationType = (
  type: WarehouseLocationType | null | undefined,
): WarehouseBlockReason | null =>
  warehouseLocationTypeMetaOf(type)?.blockReason ?? null;

/**
 * The work-order line type that describes moving goods from one kind of
 * location to another, or null when no operation does — which is what makes an
 * unsupported move visible instead of silently allowed.
 */
export const workOrderLineTypeForMove = (
  from: WarehouseLocationType | null,
  to: WarehouseLocationType | null,
): WarehouseWorkOrderLineType | null => {
  const found = warehouseWorkOrderLineTypes.find((type) => {
    const meta = WAREHOUSE_WORK_ORDER_LINE_TYPE_META[type];
    return meta.from === from && meta.to === to;
  });
  return found ?? null;
};

/** What a work-order line type does, or null when a line carries none. */
export const workOrderLineTypeMetaOf = (
  type: WarehouseWorkOrderLineType | null | undefined,
): WarehouseWorkOrderLineTypeMeta | null =>
  type ? WAREHOUSE_WORK_ORDER_LINE_TYPE_META[type] : null;

// ---------------------------------------------------------------------------
// Printers, slips and labels
//
// A printer was a name on a dropdown, so an A4 pick slip could be sent to a
// label printer, a paper tray could be chosen on a device that has no trays,
// and a 600 dpi sticker could be routed to a 203 dpi label printer. Nothing
// objected, and the print run simply came out wrong on the floor.
//
// A printer is a device with a medium, a resolution and a department; a slip
// type is the medium it has to come out on; and a label option is a count of
// labels rather than a caption. All three are known from their own value.
// ---------------------------------------------------------------------------

/** What comes out of a device. */
export type PrintMedium = "a4" | "label" | "virtual" | "file";

export type PrinterMeta = {
  medium: Exclude<PrintMedium, "file">;
  /** Prints in colour as well as black. */
  colour: boolean;
  /** Resolution, where the device has a stated one. Null for sheet printers. */
  dpi: number | null;
  /** Whose printer it is, for routing a document to the right floor. */
  department: "sales" | "logistics" | "administration" | "none";
  /** Has paper trays to choose between. A label roll and a PDF do not. */
  hasTrays: boolean;
};

export type WorkorderSlipMeta = {
  /** The medium the slip has to come out on. */
  medium: PrintMedium;
  orientation: "landscape" | "portrait" | null;
};

export type CustomerLabelMeta = {
  medium: PrintMedium | null;
  /** What one label covers, which is what decides how many are printed. */
  per: "line" | "collo" | "piece" | "none";
};

export const PRINTER_META: Record<PrinterName, PrinterMeta> = {
  sales_black: {
    medium: "a4",
    colour: false,
    dpi: null,
    department: "sales",
    hasTrays: true,
  },
  sales_color: {
    medium: "a4",
    colour: true,
    dpi: null,
    department: "sales",
    hasTrays: true,
  },
  logistics_black: {
    medium: "a4",
    colour: false,
    dpi: null,
    department: "logistics",
    hasTrays: true,
  },
  logistics_color: {
    medium: "a4",
    colour: true,
    dpi: null,
    department: "logistics",
    hasTrays: true,
  },
  administration_black: {
    medium: "a4",
    colour: false,
    dpi: null,
    department: "administration",
    hasTrays: true,
  },
  administration_color: {
    medium: "a4",
    colour: true,
    dpi: null,
    department: "administration",
    hasTrays: true,
  },
  // Thermal label printers: a roll, one resolution, no trays.
  sato_cl4nx_203dpi: {
    medium: "label",
    colour: false,
    dpi: 203,
    department: "logistics",
    hasTrays: false,
  },
  sato_cl408e_logistics: {
    medium: "label",
    colour: false,
    dpi: 203,
    department: "logistics",
    hasTrays: false,
  },
  // Virtual devices. They accept anything and produce a file, so they are never
  // the right answer for a label that has to end up on a bundle.
  microsoft_print_to_pdf: {
    medium: "virtual",
    colour: true,
    dpi: null,
    department: "none",
    hasTrays: false,
  },
  microsoft_print_to_pdf_8_redirected: {
    medium: "virtual",
    colour: true,
    dpi: null,
    department: "none",
    hasTrays: false,
  },
  onenote_desktop: {
    medium: "virtual",
    colour: true,
    dpi: null,
    department: "none",
    hasTrays: false,
  },
  onenote_desktop_8_redirected: {
    medium: "virtual",
    colour: true,
    dpi: null,
    department: "none",
    hasTrays: false,
  },
  send_to_onenote_16: {
    medium: "virtual",
    colour: true,
    dpi: null,
    department: "none",
    hasTrays: false,
  },
};

export const WORKORDER_SLIP_META: Record<WorkorderSlipType, WorkorderSlipMeta> =
  {
    a4_landscape: { medium: "a4", orientation: "landscape" },
    a4_portrait: { medium: "a4", orientation: "portrait" },
    label: { medium: "label", orientation: null },
    // Not printed at all: written out for a label machine to read.
    label_via_csv: { medium: "file", orientation: null },
  };

export const CUSTOMER_LABEL_META: Record<
  CustomerLabelOption,
  CustomerLabelMeta
> = {
  no_customer_label: { medium: null, per: "none" },
  csv_file: { medium: "file", per: "line" },
  line_label: { medium: "label", per: "line" },
  sticker_per_line: { medium: "label", per: "line" },
  sticker_per_collo: { medium: "label", per: "collo" },
  sticker_per_piece: { medium: "label", per: "piece" },
};

/** The resolution the sticker-per-pick options are specified at. */
export const STICKER_PER_PICK_DPI = 600;

/** What a printer is, or null when a setting names none. */
export const printerMetaOf = (
  printer: PrinterName | null | undefined,
): PrinterMeta | null => (printer ? PRINTER_META[printer] : null);

/**
 * Whether a device can produce a medium. A virtual printer accepts anything —
 * it only ever produces a file — which is why it is allowed here and refused
 * wherever the output has to physically end up on a bundle.
 */
export const printerAcceptsMedium = (
  printer: PrinterName | null | undefined,
  medium: PrintMedium,
): boolean => {
  const meta = printerMetaOf(printer);
  if (!meta) {
    return true;
  }
  if (medium === "file" || meta.medium === "virtual") {
    return true;
  }
  return meta.medium === medium;
};

/**
 * Whether a printer can produce a given workorder slip. An A4 slip on a label
 * roll and a label on a sheet printer are both wrong before the run starts.
 */
export const printerAcceptsSlip = (
  printer: PrinterName | null | undefined,
  slip: WorkorderSlipType | null | undefined,
): boolean =>
  slip ? printerAcceptsMedium(printer, WORKORDER_SLIP_META[slip].medium) : true;

/**
 * Whether a paper-tray choice makes sense on a device. Only a sheet printer has
 * trays; "select automatically" is always allowed, since it chooses nothing.
 */
export const printerAcceptsEntry = (
  printer: PrinterName | null | undefined,
  entry: PrinterEntry | null | undefined,
): boolean => {
  if (!entry || entry === "select_automatically") {
    return true;
  }
  const meta = printerMetaOf(printer);
  return meta ? meta.hasTrays : true;
};

/** The medium a customer label comes out on, or null when none is printed. */
export const customerLabelMedium = (
  option: CustomerLabelOption | null | undefined,
): PrintMedium | null => (option ? CUSTOMER_LABEL_META[option].medium : null);

/**
 * How many customer labels a line produces. Per line is one, per collo is one
 * for each package, per piece is one for each piece — which is the whole
 * difference between the three options, and it was not being counted anywhere.
 */
export const customerLabelCount = (
  option: CustomerLabelOption | null | undefined,
  context: { colli?: number; pieces?: number },
): number => {
  if (!option) {
    return 0;
  }
  const meta = CUSTOMER_LABEL_META[option];
  if (meta.per === "none") {
    return 0;
  }
  if (meta.per === "line") {
    return 1;
  }
  if (meta.per === "collo") {
    return Math.max(0, Math.trunc(context.colli ?? 0));
  }
  return Math.max(0, Math.trunc(context.pieces ?? 0));
};

/**
 * How many stock labels a workorder line prints, by the breakdown chosen: one
 * for the line and one per bundle, one per bundle alone, or a fixed number per
 * line.
 */
export const stockLabelCount = (
  breakdown: StockLabelBreakdown | null | undefined,
  context: { bundles?: number; amountPerLine?: number },
): number => {
  const bundles = Math.max(0, Math.trunc(context.bundles ?? 0));
  if (breakdown === "per_bundle") {
    return bundles;
  }
  if (breakdown === "amount_per_line") {
    return Math.max(0, Math.trunc(context.amountPerLine ?? 0));
  }
  // per_line_bundle: the line's own label plus one for each bundle in it.
  return 1 + bundles;
};

/**
 * Which of the warehouse's two label devices a stock label goes to: the label
 * printer for a label, the sticker printer for a sticker.
 */
export const printerFieldForStockLabelType = (
  type: StockLabelType | null | undefined,
): "labelPrinter" | "stickerPrinter" | null => {
  if (type === "label") {
    return "labelPrinter";
  }
  if (type === "sticker") {
    return "stickerPrinter";
  }
  return null;
};

/**
 * How many stickers a pick workorder prints: none, one for the whole order, or
 * one for each of its lines.
 */
export const stickerPerPickCount = (
  type: StickerPerPickWorkorderType | null | undefined,
  lineCount: number,
): number => {
  if (type === "sticker_per_workorder_600dpi") {
    return 1;
  }
  if (type === "sticker_per_workorder_line_600dpi") {
    return Math.max(0, Math.trunc(lineCount));
  }
  return 0;
};

/** Whether a sticker-per-pick setting needs a device to print anything at all. */
export const stickerPerPickNeedsPrinter = (
  type: StickerPerPickWorkorderType | null | undefined,
): boolean => Boolean(type) && type !== "no_customer_label";

/** Whether a workorder of this kind is printed without anyone asking. */
export const printsAutomatically = (
  method: WorkorderPrintMethod | null | undefined,
): boolean => method === "automatic";

/** Whether a workorder of this kind is printed at all. */
export const printsAtAll = (
  method: WorkorderPrintMethod | null | undefined,
): boolean => method !== "do_not_print";

/** Whether a workorder is released to the floor the moment it is made. */
export const releasesImmediately = (
  method: WorkorderReleaseMethod | null | undefined,
): boolean => method === "direct";

/** Whether releasing a workorder waits for the day's schedule. */
export const releasesOnSchedule = (
  method: WorkorderReleaseMethod | null | undefined,
): boolean => method === "according_to_schedule";

/**
 * What a count workorder walks: every location in turn, or every product in
 * turn. Null when the warehouse has not said.
 */
export const countWorkorderWalks = (
  method: CountWorkorderMethod | null | undefined,
): "locations" | "products" | null => {
  if (method === "counting_locations") {
    return "locations";
  }
  if (method === "products_counting") {
    return "products";
  }
  return null;
};

/** Which stock figure a count is measured against. */
export const countStockColumn = (
  type: WarehouseCountStockType | null | undefined,
): "technical" | "available" =>
  type === "available_stock" ? "available" : "technical";

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
