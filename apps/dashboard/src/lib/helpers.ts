import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  DeliveryTerm,
  DeliveryTimeUnit,
  DeliveryType,
  InvoicePaymentTerm,
  InvoiceVatScenario,
  LeadTimeMethod,
  OrderWeightType,
  StockMode,
  StockMovementType,
  TransporterPriceUnit,
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
 * display, falling back to an em dash when the value is missing.
 */
export const formatDateValue = (value: string | Date | null): string => {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleDateString("en-GB");
};

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
    let remaining = Math.trunc(amount);
    const step = remaining >= 0 ? 1 : -1;
    while (remaining !== 0) {
      date.setUTCDate(date.getUTCDate() + step);
      const day = date.getUTCDay();
      if (day !== 0 && day !== 6) {
        remaining -= step;
      }
    }
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
  isKlantMateriaal?: boolean | null;
}): string => {
  if (flags.isConsignment) {
    return "Consignment";
  }
  if (flags.isKlantMateriaal) {
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
): number => {
  let percentage = 0;
  for (const tier of normaliseDiscountTiers(tiers)) {
    if (quantity >= tier.from) {
      percentage = tier.percentage;
    }
  }
  return percentage;
};

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
