import { clsx, ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  CertificaatOption,
  CustomerGroup,
  DeliveryTerm,
  DeliveryTimeUnit,
  DeliveryType,
  InvoicePaymentTerm,
  InvoiceVatScenario,
  LeadTimeMethod,
  OrderDeblockType,
  OrderLineStatus,
  OrderWeightType,
  PurchaseOrderStatus,
  SalesRepresentative,
  SfnCounterpartyRole,
  StockMode,
  StockUnit,
  StockMovementType,
  TransporterPriceUnit,
  VatCode,
} from "./enums";
import {
  CUSTOMER_GROUP_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  ORDER_DEBLOCK_TYPE_LABELS,
  ORDER_LINE_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
  SALES_REPRESENTATIVE_LABELS,
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
 */
export type PaymentTermMeta = {
  netDays: number | null;
  endOfMonth: boolean;
  prepaymentPercentage: number;
  discountPercentage: number | null;
  discountDays: number | null;
};

const netTerm = (
  netDays: number,
  overrides?: Partial<PaymentTermMeta>,
): PaymentTermMeta => ({
  netDays,
  endOfMonth: false,
  prepaymentPercentage: 0,
  discountPercentage: null,
  discountDays: null,
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
