import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  InvoicePaymentTerm,
  InvoiceVatScenario,
  StockMovementType,
  VatCode,
} from "./enums";

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
 * Formats a JS Date as a YYYY-MM-DD string (the shape date inputs and MySQL
 * `date` columns expect).
 */
export const toDateString = (date: Date): string =>
  date.toISOString().split("T")[0];

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
