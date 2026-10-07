import { clsx, ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  AgeingBucket,
  ageingBuckets,
  ArticleGroup,
  AvailableAt,
  CeStandard,
  CertificaatOption,
  ContractableRole,
  contractableRoles,
  CommunicationSettingShape,
  CommunicationSettingType,
  CompanyClassification,
  CompanyLang,
  ContactSalutation,
  ContractDiscountBasedOnType,
  ContractSurchargePerType,
  ContractTierUnit,
  ContractType,
  ComplaintCategory,
  CounterOrderPriority,
  CountWorkorderMethod,
  Currency,
  DispatchStrategy,
  CustomerLabelOption,
  EdiOption,
  GroupLinesByDescription,
  ComplaintSolution,
  ComplaintStatus,
  ComplaintType,
  CustomerGroup,
  DeliveryTerm,
  DeliveryTimeUnit,
  DeliveryType,
  DiscountUnit,
  FeaturesQuality,
  InvoicePaymentTerm,
  InvoiceDocumentType,
  InvoiceVatScenario,
  InvoiceFrequency,
  InvoiceSurchargeDescription,
  InvoicingMethod,
  LeadTimeMethod,
  LedgerAccountType,
  MachineCapacityUnit,
  cuttingMachineOptions,
  MachineOptionType,
  MachineProductionType,
  machineProductionTypes,
  MaterialFamily,
  MaterialSurfaceFinish,
  MiscellaneousOption,
  OrderDeblockType,
  OrderLineStatus,
  OrderOption,
  PaymentMethod,
  OrderWeightType,
  PriceTierBase,
  PrinterEntry,
  ProductionCapacityStatus,
  ProductQualityStandard,
  PrinterName,
  PrintProductCodes,
  ProcessingEditing,
  ProductDimensionShape,
  ProductShape,
  OrderStatus,
  PurchaseOrderStatus,
  PurchaseInvoiceFiscalBase,
  PurchaseOrderType,
  PurchasingUnit,
  SalesUnit,
  PurchaseQuoteStatus,
  PurchaseRequestStatus,
  QuoteOption,
  QuoteOrderInvoiceOption,
  QuoteOrderOption,
  ReminderStage,
  reminderStages,
  RevenueGroup,
  revenueGroups,
  RevenueGroupKind,
  ReturnOrderReason,
  SalesRepresentative,
  SfnCounterpartyRole,
  StockMode,
  StickerPerPickWorkorderType,
  StockLabelBreakdown,
  StockLabelType,
  StockUnit,
  StockCorrectableAttribute,
  stockCorrectableAttributes,
  StockCorrectionReason,
  StockMovementType,
  TripStatus,
  tripStatuses,
  ReceiptStatus,
  SurchargeBasis,
  TextUsageCategory,
  TransporterPriceUnit,
  TransportMode,
  transportModes,
  VisitReportCategory,
  VisitReportContactMethod,
  VisitReportReason,
  VatCode,
  WarehouseAddress,
  WarehouseBlockReason,
  WarehouseCountStockType,
  WarehouseLocationType,
  warehouseLocationTypes,
  WarehouseProductType,
  WarehouseTransportRegion,
  warehouseTransportRegions,
  WarehouseStockEffect,
  WarehouseWorkOrderType,
  warehouseWorkOrderTypes,
  StockMovementReason,
  WorkorderPrintMethod,
  WorkorderReleaseMethod,
  WorkorderSlipType,
  PurchaseSourceType,
} from "./enums";
import {
  CONTACT_SALUTATION_LABELS,
  CONTRACT_TYPE_LABELS,
  CUSTOMER_GROUP_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  MONTH_LABELS,
  REVENUE_GROUP_LABELS,
  ORDER_DEBLOCK_TYPE_LABELS,
  ORDER_LINE_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_QUOTE_STATUS_LABELS,
  SALES_REPRESENTATIVE_LABELS,
  STOCK_UNIT_LABELS,
  TEXT_USAGE_CATEGORY_LABELS,
  VISIT_REPORT_REASON_LABELS,
} from "./labels";

/**
 * Merges Tailwind classes safely, resolving conflicts.
 * Pass any mix of strings, arrays, or conditional objects.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/**
 * What the database driver says went wrong, in words.
 *
 * A failed query arrives with the driver's own error hidden in `cause`, while
 * `message` holds the whole statement. Printing the statement told a reader
 * nothing they could act on: "Too many connections" read as three hundred
 * characters of SELECT.
 */
const DRIVER_FAULTS: Record<string, string> = {
  ER_CON_COUNT_ERROR:
    "the database is refusing new connections — too many are already open",
  ER_TOO_MANY_USER_CONNECTIONS:
    "the database is refusing new connections for this user",
  PROTOCOL_CONNECTION_LOST: "the database closed the connection",
  ECONNREFUSED: "the database refused the connection",
  ETIMEDOUT: "the database did not answer in time",
  ER_LOCK_WAIT_TIMEOUT: "the database timed out waiting for a lock",
  ER_NO_SUCH_TABLE: "a table this screen reads does not exist",
  ER_BAD_FIELD_ERROR: "a column this screen reads does not exist",
  ER_DUP_ENTRY: "a record with that key already exists",
};

/** The driver fault behind an error, however deeply it is wrapped. */
const driverFault = (error: unknown, depth: number = 0): string | null => {
  if (depth > 4 || typeof error !== "object" || error === null) {
    return null;
  }
  if ("code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && DRIVER_FAULTS[code]) {
      return DRIVER_FAULTS[code];
    }
  }
  if ("cause" in error) {
    return driverFault((error as { cause?: unknown }).cause, depth + 1);
  }
  return null;
};

/**
 * A readable error message for a server-action catch block: the human-friendly
 * fallback, followed by what actually went wrong.
 *
 * The driver's own fault wins when there is one, because that is the sentence
 * a reader can act on. Otherwise the error's message is used, as before.
 */
export const describeError = (error: unknown, fallback: string): string => {
  const fault = driverFault(error);
  if (fault) {
    return `${fallback}: ${fault}`;
  }
  return error instanceof Error && error.message
    ? `${fallback}: ${error.message}`
    : fallback;
};

/**
 * Returns today's date as a YYYY-MM-DD string.
 */
export const todayDateString = () => new Date().toISOString().split("T")[0];

/**
 * The current time as the 24-hour `HH:mm` string `TimePicker` reads and emits.
 *
 * Local rather than UTC, because it is offered as the default on dialogs the
 * floor fills in — the reference's `Report completion` opens on `17:59` when it
 * is 17:59 in the warehouse.
 */
export const nowTimeString = () =>
  new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

/**
 * A `year` query parameter as a year, or the current year when it is blank or
 * not a year — the reference's "leave blank for current year".
 */
export const parseYearParam = (value: string | undefined): number => {
  const year = Number(value);
  return Number.isInteger(year) && year >= 2000 && year <= 2100
    ? year
    : new Date().getFullYear();
};

/** A `month` query parameter as 1–12, or null (the whole year) otherwise. */
export const parseMonthParam = (value: string | undefined): number | null => {
  const month = Number(value);
  return value && Number.isInteger(month) && month >= 1 && month <= 12
    ? month
    : null;
};

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

/**
 * The same shape, for a quantity rather than an amount: three decimals instead
 * of two, because that is what the stock columns hold. A field that accepted
 * only two would silently round 3.999 to 4.00 and put a piece on the shelf
 * that nobody ever picked.
 */
export const DECIMAL_QUANTITY_PATTERN = /^-?\d+(?:[.,]\d{1,3})?$/;

/**
 * A hand-typed quantity as the plain decimal string MySQL accepts.
 *
 * Accepts either separator deliberately. A warehouse keyboard set to a Dutch
 * or German locale types `3,999`, and `Number("3,999")` is `NaN` — so a field
 * that only understood a dot would reject a perfectly good quantity, and a
 * browser `type="number"` would swallow the keystroke without saying why.
 */
export const toDecimalQuantity = (
  value: string | null | undefined,
  fallback = "0.000",
): string => {
  const trimmed = (value ?? "").trim();
  if (!DECIMAL_QUANTITY_PATTERN.test(trimmed)) {
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

export const formatRevenue = (value: string | number | null) => {
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
 * A weight expressed in the unit its price is struck in — the reference's
 * `Price quantity (in gross price U.)`.
 *
 * 🔴 Two decimals is not enough here. The figure is usually **tonnes**, so
 * 314 kg is 0,314 and `formatNumber` rounds it to 0,31 — which is a different
 * weight, 4 kg lighter, and it is the number the line's amount is computed
 * from. The reference prints 1 224,6 kg as `1,2246`, to four.
 */
export const formatPriceQuantity = (value: number): string =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });

/**
 * Formats a percentage for the overviews, e.g. `12.5%`.
 */
export const formatPercent = (value: number): string =>
  `${formatNumber(value)}%`;

/** A person's initials from their name — "Benno Vos" → "BV". */
export const personInitials = (name: string | null): string | null => {
  if (!name) {
    return null;
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials || null;
};

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

// The reference writes DateTime.MinValue for "never" and MaxValue for
// "forever" rather than leaving a date empty — 1-1-0001 turns up in a
// confirmation date that has not happened, 31-12-9999 in an insurance policy
// with no end. Neither is a date anyone should read, so both show as blank.
const SENTINEL_DATES = ["0001-01-01", "9999-12-31"];

/**
 * Whether a date is one of the reference's stand-ins for "no date at all".
 * Ours stores null, but data imported from the old system carries these.
 */
export const isSentinelDate = (value: string | Date | null): boolean => {
  if (!value) {
    return false;
  }
  const iso =
    typeof value === "string"
      ? value.slice(0, 10)
      : value.toISOString().slice(0, 10);
  return SENTINEL_DATES.includes(iso);
};

/**
 * A length of 999999 mm is the reference's mark for coil — endless material
 * with no cut length — not a 999 metre bar. Shown blank, like the sentinel
 * dates, so nobody reads it as a measurement.
 *
 * 🔴 Confirmed again 2-10-2026 on purchase order `401141`'s reception and on
 * two `CK…` rows of the `Batches` register: `Length 999999` beside a real width
 * and a real weight. So it also has to be stepped around by anything that
 * *multiplies* dimensions — see `lotPieceWeightKg` — or one coil weighs several
 * thousand tonnes.
 */
export const COIL_LENGTH_SENTINEL = 999999;

/**
 * What the reference types into a text filter's upper bound to mean "no upper
 * bound". It is a real value being compared against, not an empty box, which is
 * why clearing it returns nothing rather than everything.
 *
 * Ours uses an empty field. Kept here because every export captured from that
 * system carries it, and an importer that treats it as data will filter on a
 * product code of fifteen z's.
 */
export const TEXT_FILTER_UPPER_BOUND_SENTINEL = "zzzzzzzzzzzzzzz";

/**
 * How the reference renders "nothing chosen" in a dropdown — `-empty-` in the
 * English build, `-leeg-` where a screen was never translated. Both are display
 * text for null, and both turn up in exports.
 */
const EMPTY_SELECTION_SENTINELS = ["-empty-", "-leeg-"];

export const isEmptySelection = (value: string | null | undefined): boolean =>
  EMPTY_SELECTION_SENTINELS.includes((value ?? "").trim().toLowerCase());

/**
 * A heat number nobody recorded, written as free text.
 *
 * `Charge` is not a controlled field in the reference and its 2.247 lots prove
 * it: 607 blank, 145 `nvt` (Dutch *n.v.t.*, not applicable), 33 `-`, and 32
 * `ntv` — the same abbreviation transposed, typed three dozen times. All four
 * mean the same nothing, and a lot whose charge reads "ntv" must not be
 * traceable to a heat called "ntv".
 */
const ABSENT_CHARGE_SENTINELS = ["nvt", "ntv", "n.v.t.", "-", "--", "n/a"];

export const normaliseCharge = (
  value: string | null | undefined,
): string | null => {
  const charge = (value ?? "").trim();
  if (!charge || ABSENT_CHARGE_SENTINELS.includes(charge.toLowerCase())) {
    return null;
  }
  return charge;
};

/**
 * The internal charge that follows `lastCharge` in `year` — the batch identity
 * this business gives received material.
 *
 * The reference's format, on all 2 540 received rows: the two-digit year and
 * four capital letters, counted up (`25AAAM`, `25ACRT`, `25ADPY`), starting
 * again at `AAAA` when the year turns. The mill's own heat number is `charge`;
 * this one is ours, and it is the key every delivered sheet traces back by —
 * 1 662 of 1 662 shipped charges to the same heat, purchase order and receipt.
 */
export const nextInternalCharge = (
  year: number,
  lastCharge: string | null,
): string => {
  const prefix = String(year % 100).padStart(2, "0");
  if (
    !lastCharge ||
    !lastCharge.startsWith(prefix) ||
    !/^\d{2}[A-Z]{4}$/.test(lastCharge)
  ) {
    return `${prefix}AAAA`;
  }

  // Base-26 over A–Z: add one to the last letter and carry leftwards past Z.
  const { letters, carry } = lastCharge
    .slice(2)
    .split("")
    .reduceRight<{ letters: string[]; carry: boolean }>(
      (state, letter) => {
        if (!state.carry) {
          return { letters: [letter, ...state.letters], carry: false };
        }
        return letter === "Z"
          ? { letters: ["A", ...state.letters], carry: true }
          : {
              letters: [
                String.fromCharCode(letter.charCodeAt(0) + 1),
                ...state.letters,
              ],
              carry: false,
            };
      },
      { letters: [], carry: true },
    );
  if (carry) {
    throw new Error(`No internal charge left after ${lastCharge} in ${year}`);
  }
  return `${prefix}${letters.join("")}`;
};

/**
 * The internal batch that follows `lastBatch` — the number that identifies one
 * physical bundle.
 *
 * 🔴 Not the same thing as the internal charge, and the two were the wrong way
 * round here until the receipt of purchase order 401141 was watched on
 * 21-9-2026. One lorry-load became five lots. All five shared internal charge
 * `26ADRC`, and each took its own consecutive number — 389823, 389824, 389825,
 * 389826, 389827.
 *
 * So the charge names the **receipt** and this names the **lot**. It is a plain
 * running series with no year in it, which is why numbers from 2024 (385178)
 * and 2026 (389823) sit in one sequence. The reference calls it `Internal
 * batch` on its panels, `Bundle` in its exports and `Interne partij` in its lot
 * picker; all three are this number.
 *
 * Six digits is the width every observed value has, not a ceiling — the series
 * is allowed to outgrow it rather than wrap.
 */
export const nextInternalBatch = (lastBatch: string | null): string => {
  const previous = Number(lastBatch ?? 0);
  const next = Number.isFinite(previous) && previous > 0 ? previous + 1 : 1;
  return String(next).padStart(6, "0");
};

export const formatLengthMm = (
  value: number | string | null | undefined,
): string => {
  const length = Number(value ?? 0);
  if (!length || length === COIL_LENGTH_SENTINEL) {
    return "—";
  }
  return formatNumber(length);
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
  if (!value || isSentinelDate(value)) {
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
  if (!value || isSentinelDate(value)) {
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
/**
 * Rounds an amount to the cent, half-up, the way a ledger does.
 *
 * `Number.prototype.toFixed` does not: it rounds the binary approximation of
 * the number rather than the decimal, so it lands a cent **low** on an exact
 * half-cent. 462,9 kg at EUR 2 550/TN comes to EUR 1 180,395, which the
 * reference prints as EUR 1 180,40 and `toFixed(2)` writes as EUR 1 180,39.
 * Two of eighteen priced lines read off the reference's Blocked deliveries
 * screen land on that boundary, so it is common enough to matter.
 *
 * ⚠️ `Math.round(value * 100) / 100` does not fix it either, which this
 * function claimed to do for months and did not. The drift is already in the
 * argument: 462,9 x 2,55 evaluates to 1 180,394999999999 and 950 x 0,0707 to
 * 67,16499999999999, both a hair **below** the midpoint, so an honest rounder
 * is right to round them down. The decimal the arithmetic meant is gone before
 * this function is called.
 *
 * So recover it first. Twelve significant digits is far inside a double's
 * fifteen-to-seventeen, which means `toPrecision` restores the intended
 * decimal without touching a value that genuinely sits below the boundary:
 * 67,16499 and even 67,1649999999 still round down. Across 600.000 random
 * amounts this differs from the naive form on one, and that one is a true
 * half-cent. Above 1e9 cents there is no slack left to recover, so it steps
 * aside.
 *
 * The 950/921,50 pair is the reference's own arithmetic, off purchase quote
 * 900003: 70,7 kg at EUR 950/TN prints EUR 67,17, at EUR 921,50/TN EUR 65,15.
 *
 * ⚠️ One behaviour changes for negative amounts. Half-up means toward +∞, so a
 * credit line landing exactly on -67,165 now reads -67,16 where it used to
 * read -67,17. That is the consistent reading rather than a new rule — the old
 * answer came from drift, not from a decision — but no negative half-cent has
 * been seen in the reference, so it is an assumption and not a proof.
 *
 * Anything storing money should round with this first and only then format, so
 * that what is written matches what the reference would have written.
 */
export const roundToCents = (value: number): number => {
  const scaled = value * 100;
  const meant =
    Math.abs(scaled) < 1e9 ? Number(scaled.toPrecision(12)) : scaled;
  return Math.round(meant) / 100;
};

/** An amount as a decimal string, rounded to the cent the way a ledger does. */
export const moneyString = (value: number): string =>
  roundToCents(value).toFixed(2);

/**
 * A cost per unit as a decimal string, at the five decimals a lot's valuation
 * price carries.
 *
 * Not `moneyString`: this is not an amount anybody is paid, it is the rate the
 * stock value is derived from, and the reference keeps five decimals of it
 * (`1537,61789`). Rounding it to the cent — or even to four places — makes the
 * stock value disagree with the reference's by cents on every sizeable lot.
 */
export const unitCostString = (value: number): string => value.toFixed(5);

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

/**
 * A readable name for a path the menu does not carry — "/system-log" reads as
 * "System log". A uuid segment is skipped, since a page is never named after
 * the record it happens to be showing.
 */
export const titleFromPath = (pathname: string): string => {
  const segment = pathname
    .split("/")
    .filter(Boolean)
    .find((part) => !/^[0-9a-f]{8}-/i.test(part));
  if (!segment) {
    return "Dashboard";
  }
  const words = segment.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
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
 *   - creditRestrictionPercentage: the Dutch "kredietbeperking" surcharge —
 *     see DEFAULT_CREDIT_RESTRICTION_PERCENTAGE below.
 */
export type TripStatusMeta = {
  /** Position on the ladder; a trip only ever moves up it. */
  readonly step: number;
  /** True once the goods are physically on the vehicle. */
  readonly isLoaded: boolean;
  /** True once the loading bay has nothing left to do with the trip. */
  readonly leftTheYard: boolean;
};

type ReceiptStatusMeta = {
  readonly step: number;
  /** True once an Unloading work order exists for the reception. */
  readonly workOrderRaised: boolean;
  /** True once some or all of the goods are physically in stock. */
  readonly goodsAreIn: boolean;
};

/**
 * Which of the reference's five reception-toolbar buttons are live for the
 * selected row. Every `false` carries the sentence that says why, because a
 * grey button with no explanation is what sent us hunting for H13 twice.
 */
export type ReceptionActions = {
  readonly canDelete: boolean;
  readonly deleteReason: string | null;
  readonly canRegisterBatch: boolean;
  readonly canAdjustCharge: boolean;
  /** Covers both stamping actions — they wake and sleep together. */
  readonly stampReason: string | null;
  readonly canSplit: boolean;
  readonly splitReason: string;
};

/** The fields of a purchase line its toolbar decides on. */
export type PurchaseLineActionInput = {
  readonly lineStatus: OrderLineStatus | null;
  readonly orderedQuantity: string;
  readonly qtyReceived: string | null;
  readonly closedAt: Date | null;
};

export type PurchaseLineActions = {
  readonly canClose: boolean;
  /** Always a sentence — why the button is awake, or why it is not. */
  readonly closeReason: string;
};

type PaymentTermMeta = {
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
  /**
   * The debtor's **insured** limit — what the credit insurer will cover. 0 or
   * absent means nobody has set one.
   */
  creditLimit: number;
  /**
   * The limit the merchant carries on its own book, on top of the insured one.
   * The reference calls it `Credit limit uninsured` / `Onverzekerd Limiet`, and
   * a customer's room is the **sum** of the two.
   */
  creditLimitUninsured?: number;
  /**
   * When the uninsured limit lapses. Past that date it does not count. Usually
   * the `31-12-9999` sentinel, which means it never lapses.
   */
  creditLimitUninsuredValidUntil?: string | Date | null;
  /**
   * The due date of the oldest receivable still open. Null when nothing is
   * open, or when the oldest one carries no derivable due date.
   */
  oldestOpenDueDate?: string | Date | null;
  /** The day the assessment is made on. Defaults to today. */
  asOf?: string;
  /**
   * What the customer already owes on invoices that still stand, excluding
   * VAT — the reference's `Open entrees` / `Open posten excl BTW`.
   */
  openReceivables: number;
  /**
   * Orders taken but not yet invoiced, excluding VAT. These are receivables in
   * waiting: the goods are promised, so the exposure is real even though no
   * invoice exists yet. Excludes the order being assessed, which is counted
   * separately.
   */
  committedOrders?: number;
  /** The order being placed, excluding VAT — the reference's `Order amount`. */
  orderAmount: number;
  /** The company has been stopped by hand, whatever its balance says. */
  companyBlocked: boolean;
  /**
   * The customer's order settings waive financial blocking, so an overrun is
   * recorded but does not hold the order. Set from `orderBlockingPolicy`.
   */
  financialBlockingWaived?: boolean;
  /**
   * Days past due before the oldest open post holds an order — the branch
   * setting. Defaults to `OVERDUE_POST_BLOCK_DAYS`.
   */
  overduePostBlockDays?: number;
};

export type CreditAssessment = {
  blocked: boolean;
  /** Why it was held, short enough for `Orders.blockingReason` (varchar 255). */
  reason: string | null;
  /**
   * The limit was exceeded but the customer's order settings waive financial
   * blocking, so the order passes with the overrun recorded against it. A
   * blocked customer is still blocked: that is a decision somebody took by
   * hand, not a limit being reached.
   */
  waived: boolean;
  creditLimit: number;
  /** The uninsured limit that counted — 0 once it has lapsed. */
  creditLimitUninsured: number;
  /** Both limits together: what `creditSpace` is measured against. */
  totalCreditLimit: number;
  openReceivables: number;
  committedOrders: number;
  /**
   * How many days past due the oldest open receivable is, or null when there is
   * nothing open or no due date to measure from.
   */
  oldestPostDaysOverdue: number | null;
  /** Room left before the limit is reached; negative once it is exceeded. */
  creditSpace: number;
  /** Everything owed and promised, including this order. */
  exposure: number;
};

/**
 * How many days past due the oldest open receivable may be before an order is
 * held, regardless of how much room the customer has left.
 *
 * WARNING: this number is an assumption and the exports cannot settle it. The
 * reference's `Financially blocked quotes and orders` names the reason —
 * `Post(s) outstanding for too long` — but the threshold lives on a settings
 * screen nobody has captured. Cross-referencing the two exports does not pin it
 * either: that screen only lists debtors who *have* an order right now, so the
 * 153 customers who are overdue and absent from it are mostly customers with
 * nothing to block, not evidence of a higher threshold.
 *
 * What the data does give is a ceiling. All eleven debtors held for this reason
 * are between **496 and 614 days** past due, so any threshold from 1 to 496
 * reproduces every observed block. 30 days past the agreed due date is ordinary
 * trade practice and sits safely inside that range.
 *
 * Confirm it with Swedinox and change this one constant.
 *
 * 14-9-2026: every menu of the reference (`Bestand` … `Extra`) and a blocked
 * customer's `Debtor` panel have been opened — no screen holds this setting.
 * It is not per customer, so it is system-wide and hidden. Only INAD (the
 * vendor) or Swedinox's administrator can give the number (question K1). Note
 * too that open posts reach the reference from AFAS by a batch job that appears
 * switched off, so the overdue days it blocks on may be stale (K10).
 *
 * 15-9-2026: the reference's security profiles prove a settings screen exists
 * (`Vestigingsgegevens`), so the number is a setting, not code. It now lives in
 * `BranchSettings.overduePostBlockDays`, editable on Settings; this constant is
 * the default for a branch that has not set one.
 */
export const OVERDUE_POST_BLOCK_DAYS = 30;

/**
 * A debtor's total credit limit: the insured one plus the uninsured one, unless
 * the uninsured one has lapsed.
 *
 * Kept as its own function because two places need it and they must not
 * disagree — `assessCredit`, which decides whether to hold an order, and the
 * Credit information customers screen, which shows the operator the number the
 * order will be held against. The screen used to compute its own, from the
 * insured limit alone.
 */
export const effectiveCreditLimit = (
  creditLimit: number,
  creditLimitUninsured: number,
  uninsuredValidUntil: string | Date | null = null,
  asOf: string = todayDateString(),
): number => {
  const stillValid =
    uninsuredValidUntil === null ||
    isSentinelDate(uninsuredValidUntil) ||
    (daysOverdue(uninsuredValidUntil, asOf) ?? 0) <= 0;
  return creditLimit + (stillValid ? creditLimitUninsured : 0);
};

/**
 * Decides whether an order should be held for credit reasons.
 *
 * The exposure being tested is what the customer would owe once this order is
 * invoiced: everything outstanding today, plus this order's gross value. That
 * is compared against the limits recorded on the debtor.
 *
 * **There are two limits.** `creditLimit` is what the credit insurer covers —
 * 346 of the 351 customers in the reference who have one also carry an
 * insurance policy number — and `creditLimitUninsured` is what the merchant
 * carries on its own book on top. A customer's room is the sum, proved on all
 * 2.593 rows of the reference's `Credit information customers` export and again
 * on all 31 rows of its blocked-order screen:
 *
 *   Creditspace = Credit limit + Credit limit uninsured
 *               - Outstanding entrees - Current orders
 *
 * Using the insured limit alone is not a rounding error. **187 of those 2.593
 * customers have no insured limit at all** and trade entirely on the uninsured
 * one; every one of them would compute a credit space of `0 - owed` and be held
 * the moment they owed anything.
 *
 * **Three reasons hold an order, and they are independent.** Of the reference's
 * 31 held orders: 18 for outstanding posts, 11 for the limit, 2 for a blocked
 * customer. Seventeen of those eighteen have more room than the order needs —
 * an age-of-debt rule is not an amount rule, and it is the most common reason
 * an order is held in that system.
 *
 * **Every amount is excluding VAT.** The formula holds on the reference's
 * excl.-VAT pair and breaks on 315 rows with the incl.-VAT one, and its
 * `Order amount` equals the order's revenue excl. VAT on 436 of 436 orders.
 *
 * **A zero limit is a limit of zero, and prepayment is no exemption.** Of the
 * reference's 11 `Credit limit exceeded` orders, 8 are `Prepayment` customers,
 * and 9 of its 10 prepayment rows have `Credit limit` 0. They are held: a
 * customer with no credit gets no credit, and a prepayment order waits for the
 * money. The hold *is* the prepayment mechanism — there is no separate status.
 * (An earlier version refused to block both cases; the queue proved it wrong.)
 *
 * A company stopped by hand is blocked regardless of all of it, since that flag
 * exists precisely to override the arithmetic.
 */
export const assessCredit = ({
  creditLimit,
  creditLimitUninsured = 0,
  creditLimitUninsuredValidUntil = null,
  oldestOpenDueDate = null,
  asOf = todayDateString(),
  openReceivables,
  committedOrders = 0,
  orderAmount,
  companyBlocked,
  financialBlockingWaived = false,
  overduePostBlockDays = OVERDUE_POST_BLOCK_DAYS,
}: CreditAssessmentInput): CreditAssessment => {
  const owed = openReceivables + committedOrders;
  const exposure = owed + orderAmount;

  const totalCreditLimit = effectiveCreditLimit(
    creditLimit,
    creditLimitUninsured,
    creditLimitUninsuredValidUntil,
    asOf,
  );
  const uninsured = totalCreditLimit - creditLimit;
  const oldestPostDaysOverdue = daysOverdue(oldestOpenDueDate, asOf);

  const standing = {
    creditLimit,
    creditLimitUninsured: uninsured,
    totalCreditLimit,
    openReceivables,
    committedOrders,
    oldestPostDaysOverdue,
    // Room left before the limit, counting what is promised as well as what is
    // billed — an order taken is a receivable waiting to happen.
    creditSpace: totalCreditLimit - owed,
    exposure,
    waived: false,
  };

  if (companyBlocked) {
    return {
      ...standing,
      blocked: true,
      reason: "Customer is blocked",
    };
  }

  // Before the limit test: money already late is late whatever the room.
  if (
    oldestPostDaysOverdue !== null &&
    oldestPostDaysOverdue > overduePostBlockDays
  ) {
    const stale = `Post(s) outstanding for too long — the oldest is ${oldestPostDaysOverdue} days past due`;
    if (financialBlockingWaived) {
      return {
        ...standing,
        waived: true,
        blocked: false,
        reason: `${stale} (not blocked: financial blocking waived)`,
      };
    }
    return { ...standing, blocked: true, reason: stale };
  }

  if (exposure <= totalCreditLimit) {
    return { ...standing, blocked: false, reason: null };
  }

  const overrun = `Credit limit exceeded — ${formatMoney(owed)} owed and on order plus ${formatMoney(orderAmount)} on this one against a ${formatMoney(totalCreditLimit)} limit`;

  // The customer's order settings can waive financial blocking. The overrun is
  // still recorded against the order — somebody has to be able to see it — but
  // the order is not held.
  if (financialBlockingWaived) {
    return {
      ...standing,
      waived: true,
      blocked: false,
      reason: `${overrun} (not blocked: financial blocking waived)`,
    };
  }

  return { ...standing, blocked: true, reason: overrun };
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

/** The calendar day a date or timestamp falls on, as "yyyy-MM-dd". */
const calendarDay = (value: string | Date): string =>
  typeof value === "string"
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);

/**
 * Whole calendar days from one date to another, ignoring the time of day —
 * 8-4-2025 14:43 to 9-4-2025 11:29 is 1.
 */
export const calendarDaysBetween = (
  from: string | Date,
  to: string | Date,
): number =>
  Math.round(
    (Date.parse(calendarDay(to)) - Date.parse(calendarDay(from))) / 86_400_000,
  );

/**
 * A complaint's `Resolution time (calendar days)`, proved on 74 of 74
 * reference rows: from the report date to the day the status became Done. An
 * open complaint reads 0 — not the days it has been open so far, which is what
 * `Days in system` on its lines counts instead.
 */
export const complaintResolutionDays = (
  status: ComplaintStatus | null | undefined,
  reportDate: string | Date | null | undefined,
  statusDate: string | Date | null | undefined,
): number =>
  status === "done" && reportDate && statusDate
    ? Math.max(0, calendarDaysBetween(reportDate, statusDate))
    : 0;

/**
 * The document a complaint names, the way the reference prints it in
 * `Order/quote`: its series letter and number — `O100070` for a sales order,
 * `IO400057` for a purchase order. The complaint type decides which one.
 */
export const complaintDocumentCode = (document: {
  complaintType: ComplaintType | null | undefined;
  orderId: number | null;
  quoteId: number | null;
  counterOrderId: number | null;
  purchaseOrderId: number | null;
  purchaseQuoteId: number | null;
  returnOrderId: number | null;
}): string | null => {
  const series: Array<[string, number | null]> = [
    ["O", document.orderId],
    ["Q", document.quoteId],
    ["C", document.counterOrderId],
    ["IO", document.purchaseOrderId],
    ["IQ", document.purchaseQuoteId],
    ["R", document.returnOrderId],
  ];
  const found = series.find(([, id]) => id !== null);
  return found ? `${found[0]}${found[1]}` : null;
};

/**
 * The six document links of a complaint with only the one its type calls for
 * set. The reference offers a single `Order:` picker whose meaning the type
 * decides, so a type change must not leave the previous kind's link behind.
 */
export const complaintDocumentColumns = (
  complaintType: ComplaintType | null | undefined,
  documentUuid: string | null | undefined,
): {
  orderUuid: string | null;
  quoteUuid: string | null;
  counterOrderUuid: string | null;
  purchaseOrderUuid: string | null;
  purchaseQuoteUuid: string | null;
  returnOrderUuid: string | null;
} => {
  const uuid = documentUuid || null;
  return {
    orderUuid: complaintType === "order" ? uuid : null,
    quoteUuid: complaintType === "quote" ? uuid : null,
    counterOrderUuid: complaintType === "counter_order" ? uuid : null,
    purchaseOrderUuid: complaintType === "purchase_order" ? uuid : null,
    purchaseQuoteUuid: complaintType === "purchase_quote" ? uuid : null,
    returnOrderUuid: complaintType === "return_order" ? uuid : null,
  };
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
 * The return reason a complaint category implies.
 *
 * Once the reference's own six reasons replaced the invented ones, the two
 * vocabularies turned out to be almost the same list — so this is nearly an
 * identity, and the mapping is safe rather than a guess.
 *
 * Two complaint categories have no counterpart and get **no reason at all**:
 * `wrong_price_calculated` is about money, not goods, and
 * `incorrect_delivery_address` says where it went rather than what came back.
 * The column is nullable in the reference too, so an unset reason is a legal
 * state — better than forcing one that would misreport why the metal returned.
 */
export const returnReasonForComplaintCategory = (
  category: ComplaintCategory | null | undefined,
): ReturnOrderReason | null => {
  switch (category) {
    case "damaged":
      return "damaged";
    case "transport_damage":
      return "transport_damage";
    case "wrong_material_delivered":
      return "wrong_material_delivered";
    case "wrong_quantity":
      return "wrong_quantity";
    case "delivered_too_late":
      return "delivered_too_late";
    default:
      return null;
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

  const accounted = totalInclVat + creditRestriction;

  // 🔴 The gap, always — including when the supplier total reads zero.
  //
  // This used to return 0 whenever `invoiceTotal` was 0, on the reading that
  // "no total keyed" means "nothing to reconcile". But zero is ambiguous: it is
  // also what a document says when somebody fat-fingers the one figure they are
  // asked to type, and that is precisely the case worth shouting about. An
  // invoice booking EUR 606,02 of goods against a supplier total of EUR 0,00
  // showed a remainder of EUR 0,00 — the reconciliation reporting that
  // everything balanced while 606 euro went unexplained.
  //
  // An empty document still nets to zero on its own, because `accounted` is
  // zero too, so the special case bought nothing and hid a real discrepancy.
  const remainder = invoiceTotal - accounted;

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
    // What the document is worth for payment. The supplier's own total where
    // they gave one; the build-up where they did not, so goods received are
    // still owed for rather than written off by an unkeyed box.
    totalGeneral: invoiceTotal > 0 ? invoiceTotal : accounted,
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
 * Profit margin as a percentage of revenue.
 *
 * This is the **reporting** rule, and its divisor is signed. A credit line on
 * the Revenue per product screen reading -502,20 revenue and -36,26 profit
 * prints a margin of +7,2 %, and 36 of its 2.702 rows do the same — dividing
 * by the absolute revenue would make every one of them negative. The invoice
 * line's own `Profit margin line` agrees.
 *
 * Revenue of nothing reports a margin of nothing: all 80 zero-revenue rows on
 * that screen print 0, including the ten that carry a profit.
 *
 * The **sales documents** answer both questions differently — see
 * `documentProfitMarginPercent`. Two screens, two conventions, and neither can
 * be reproduced by the other.
 *
 * The result is deliberately unrounded. Each screen rounds differently — the
 * order header to one decimal, the order lines not at all, the invoice line to
 * two — so rounding here would be wrong somewhere. Round at the edge.
 */
export const profitMarginPercent = (revenue: number, profit: number): number =>
  revenue === 0 ? 0 : (profit / revenue) * 100;

/**
 * The same margin over an **unsigned** denominator.
 *
 * The invoice line reports two margins side by side and they do not agree on a
 * credit note. `Profit margin line` divides by the signed revenue, so invoice
 * `501253` — revenue -13 400.25, profit -1 210.29 — prints **+9.03**. `Profit
 * margin products` divides by its size and prints the same figure negative.
 * Both are on the same row of the same grid, so neither can be called the
 * mistake; they are two conventions and the screen uses both.
 *
 * Unrounded, like its sibling: the products column rounds to one decimal and
 * the line column to two.
 */
export const absoluteProfitMarginPercent = (
  revenue: number,
  profit: number,
): number => (revenue === 0 ? 0 : (profit / Math.abs(revenue)) * 100);

/**
 * The same margin as a **sales document** reports it.
 *
 * Identical to `profitMarginPercent` except when the document earned nothing:
 * an order that sells for zero has made all of its profit as margin, so it
 * reads ±100 by the sign. `O100756` in the reference sells for nothing at a
 * cost of eleven cents and prints -100, and 473 of its 4.975 order lines read
 * exactly 100 for the same reason.
 *
 * Two screens, two answers to one division by zero. Keeping them apart is the
 * only way both can be reproduced.
 */
export const documentProfitMarginPercent = (
  revenue: number,
  profit: number,
): number => {
  if (revenue === 0) {
    if (profit === 0) {
      return 0;
    }
    return profit > 0 ? 100 : -100;
  }
  return (profit / Math.abs(revenue)) * 100;
};

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
  /**
   * kg/dm3 held on the article itself. The reference stores a density per
   * product rather than looking one up per grade, so when a product carries
   * its own it wins — a 316L plate at 7,850 rather than the 300 series' 7,900.
   */
  densityOverride?: number | null,
): number | null => {
  const area = crossSectionAreaMm2(shape, dimensions);
  const density =
    densityOverride && densityOverride > 0
      ? densityOverride
      : materialDensityOf(grade);
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
  densityOverride?: number | null,
): Partial<DerivedArticleWeights> => {
  const weightPerM1 = weightPerMetreOf(
    shape,
    dimensions,
    grade,
    densityOverride,
  );
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
  densityOverride?: number | null,
): Partial<Record<keyof DerivedArticleWeights, string>> => {
  const derived = deriveArticleWeights(
    shape,
    dimensions,
    grade,
    densityOverride,
  );
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
    amount: moneyString(
      computeSurchargeAmount(
        row.description,
        Number(row.surcharge ?? 0),
        context,
      ),
    ),
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

/**
 * Whether an option divides the material into different pieces from the ones
 * that went in. A cut has to be reported against a kilo balance because what
 * comes off the machine is not what went on it; a treatment does not, because
 * it is.
 */
export const machineOptionCuts = (
  option: MachineOptionType | null | undefined,
): boolean =>
  option
    ? (cuttingMachineOptions as readonly MachineOptionType[]).includes(option)
    : false;

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

export type WarehouseWorkOrderTypeMeta = {
  /**
   * The route this type of work normally takes. A line carries the real
   * locations it was raised for, which may differ — a pick feeding a machine
   * ends at the machine rather than at the call-off shelf — so these are what
   * the type means, not a constraint on where a line may go.
   *
   * `null` on either side is the company boundary: goods arriving from outside,
   * or leaving for good.
   */
  from: WarehouseLocationType | null;
  to: WarehouseLocationType | null;
  /** What reporting a line of this type completed does to stock. */
  stockEffect: WarehouseStockEffect;
  /** The reason the resulting stock movements are logged under. */
  movementReason: StockMovementReason;
  /** The line is closed by scanning, not by typing. */
  requiresScan: boolean;
  /**
   * What raised the line, and therefore what it must point at.
   *
   * Work is not invented on the floor — it is generated from a document. A pick
   * exists because somebody ordered the material; an unloading exists because
   * somebody bought it. Only the housekeeping types answer to nothing: a count,
   * a relocation or a write-off serves no counterparty, which is why the old
   * system left the Company and Order columns blank on those and filled them on
   * every other.
   */
  serves: "order" | "purchase" | null;
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
  // At a machine. Not free to sell — it is spoken for by the run — but not
  // blocked either: 22 of the reference's 23 lots at a `Productie` location are
  // unblocked.
  production: {
    holdsStock: true,
    sellable: false,
    pickable: false,
    countable: true,
    inTransit: true,
    blockReason: null,
  },
  // Out at an external processor. **Blocked**, and the reference is absolute
  // about it: all 36 of its lots at a `Bewerker` location carry the flag. The
  // metal is off the premises and in somebody else's hands.
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
  // Staged for a truck: already picked for somebody, so not free to sell again
  // — but not blocked. None of the reference's 168 lots at a `Laad` location
  // carries the flag, and rightly: the metal is ours and on its way out.
  load: {
    holdsStock: true,
    sellable: false,
    pickable: false,
    countable: false,
    inTransit: true,
    blockReason: null,
  },
  // Waiting for the customer to collect it — picked, and theirs. Both the
  // reference's `Afhaal` lots are unblocked.
  collection: {
    holdsStock: true,
    sellable: false,
    pickable: false,
    countable: false,
    inTransit: true,
    blockReason: null,
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
  // Written off, not held back: all 27 of the reference's `Schroot` lots are
  // unblocked. Scrap is unsellable because it is scrap, not because anybody
  // stopped it.
  scrap: {
    holdsStock: true,
    sellable: false,
    pickable: false,
    countable: false,
    inTransit: false,
    blockReason: null,
  },
};

export const WAREHOUSE_WORK_ORDER_TYPE_META: Record<
  WarehouseWorkOrderType,
  WarehouseWorkOrderTypeMeta
> = {
  // The two boundary crossings. Goods arrive off a purchase order and land in
  // receiving; goods leave when the customer collects them. These are the only
  // types that change how much stock the company holds in total.
  unloading: {
    from: null,
    to: "put_away",
    stockEffect: "in",
    movementReason: "warehouse_receipt",
    requiresScan: true,
    serves: "purchase",
  },
  pick_up: {
    from: "collection",
    to: null,
    stockEffect: "out",
    movementReason: "warehouse_issue",
    requiresScan: true,
    serves: "order",
  },
  // A write-off. The material is still physically there when the line is
  // raised, but it stops being stock the moment the line is reported.
  scrapping: {
    from: "pick",
    to: null,
    stockEffect: "out",
    movementReason: "warehouse_scrapped",
    requiresScan: false,
    serves: null,
  },
  // The internal moves. None of them change the total; each takes a lot off one
  // location and puts it on another.
  restocking: {
    from: "put_away",
    to: "bulk",
    stockEffect: "move",
    movementReason: "warehouse_transfer",
    requiresScan: true,
    serves: null,
  },
  transferring: {
    from: "bulk",
    to: "pick",
    stockEffect: "move",
    movementReason: "warehouse_transfer",
    requiresScan: true,
    serves: null,
  },
  relocating: {
    from: "bulk",
    to: "bulk",
    stockEffect: "move",
    movementReason: "warehouse_transfer",
    requiresScan: true,
    serves: null,
  },
  arranging: {
    from: "sorting",
    to: "pick",
    stockEffect: "move",
    movementReason: "warehouse_transfer",
    requiresScan: false,
    serves: null,
  },
  // 🔴 Picking ends at the loading bay, not at a call-off shelf.
  //
  // Corrected 21-9-2026, first by watching order 102191 raise a picking that
  // ran `From Ontvangst` `To Laad`, then against the reference's own 3.936
  // picking rows: **3 420 go to `Laad`**, 287 to `Afhaal` (collection), 190 are
  // blank, and only **39** to `Afroep` — the call-off location this had as its
  // destination. A route nobody takes on 1 % of rows was standing in for the
  // one taken on 87 %, so an ordinary pick did not match any known route.
  picking: {
    from: "pick",
    to: "load",
    stockEffect: "move",
    movementReason: "warehouse_transfer",
    requiresScan: true,
    serves: "order",
  },
  fetching: {
    from: "put_away",
    to: "processing",
    stockEffect: "move",
    movementReason: "warehouse_transfer",
    requiresScan: true,
    serves: "order",
  },
  // Counting moves nothing. It reconciles a lot to what was found on the shelf,
  // so the reported quantity is the new quantity rather than an amount to shift.
  counting_location: {
    from: null,
    to: null,
    stockEffect: "count",
    movementReason: "count_correction",
    requiresScan: false,
    serves: null,
  },
  counting_product: {
    from: null,
    to: null,
    stockEffect: "count",
    movementReason: "count_correction",
    requiresScan: false,
    serves: null,
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
 *
 * ⚠️ Blocked is **not** the same question as sellable, and conflating them was
 * an error this table used to carry. Metal staged for loading is not free to
 * sell and not blocked either; scrap is unsellable because it is scrap. The
 * reference's 2.247 lots settle which types really carry the flag:
 *
 *   Bewerker  36 of 36 blocked      Afroep    12 of 12 blocked
 *   Productie  1 of 23              Laad       0 of 168
 *   Schroot    0 of 27              Afhaal     0 of 2
 *   Pick       0 of 1.934           Bulk       0 of 45
 *
 * So only two types block by their nature — the metal is off the premises, or
 * it belongs to a customer's call-off. Everything else that reads "blocked" was
 * blocked by hand, which is what `Warehouses.blocked` and `Stock.blocked` are
 * for.
 */
export const blockReasonForLocationType = (
  type: WarehouseLocationType | null | undefined,
): WarehouseBlockReason | null =>
  warehouseLocationTypeMetaOf(type)?.blockReason ?? null;

/**
 * The work-order type that describes moving goods from one kind of location to
 * another, or null when no operation does — which is what makes an unsupported
 * move visible instead of silently allowed.
 *
 * Counting is skipped: it carries no route, so both counting types would match
 * a nowhere-to-nowhere move and the first of them would win by accident.
 */
export const warehouseWorkOrderTypeForMove = (
  from: WarehouseLocationType | null,
  to: WarehouseLocationType | null,
): WarehouseWorkOrderType | null => {
  const found = warehouseWorkOrderTypes.find((type) => {
    const meta = WAREHOUSE_WORK_ORDER_TYPE_META[type];
    return meta.stockEffect !== "count" && meta.from === from && meta.to === to;
  });
  return found ?? null;
};

/** What a work-order type does, or null when an order carries none. */
export const warehouseWorkOrderTypeMetaOf = (
  type: WarehouseWorkOrderType | null | undefined,
): WarehouseWorkOrderTypeMeta | null =>
  type ? WAREHOUSE_WORK_ORDER_TYPE_META[type] : null;

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
// The customer's own document and blocking settings
//
// A company carries six sets of options — quote, order, quote/order,
// quote/order/invoice, miscellaneous and EDI — as arrays of enum values, and
// not one of them was ever read. So a customer set up with "no financial
// blockage" was blocked by the credit rule anyway, one set up with "do not
// print prices" was sent an invoice with a price column, and one whose
// documents were supposed to lead with its own product code got ours.
//
// Each option below is one decision, taken from the value itself.
// ---------------------------------------------------------------------------

export type DocumentBlockingPolicy = {
  /**
   * The commercial block — margin floors, missing data — is waived for this
   * customer.
   */
  commercialBlockingWaived: boolean;
  /** The credit rule does not hold this customer's orders. */
  financialBlockingWaived: boolean;
};

export type DocumentPrintPolicy = {
  /** Prices appear on the document at all. */
  printPrices: boolean;
  /** Only the line total, not the unit price it came from. */
  totalAmountPerLine: boolean;
  /** Options are rolled into their line rather than listed separately. */
  condenseOptions: boolean;
  /** Option prices are folded into the material price. */
  optionPricesInMaterialPrices: boolean;
  /** Gross price and discount are suppressed; only the net price is shown. */
  netPricesOnly: boolean;
  /** The scrap surcharge is a line of its own rather than being priced in. */
  scrapSurchargeSeparate: boolean;
  /** Which product code the document leads with. */
  productCode: "none" | "external" | "own";
  /** The order the lines are printed in. */
  lineOrder: "entered" | "alphabetical" | "lowest_line";
  /** Group headings are printed above the lines belonging to them. */
  printGroupTitles: boolean;
};

export type CustomerMiscPolicy = {
  /** A one-off buyer: no standing terms, no visit schedule. */
  occasionalCustomer: boolean;
  /** Has a login for the portal. */
  hasPortalLogin: boolean;
  /** One bill of lading per order rather than per consignment. */
  billOfLadingPerOrder: boolean;
  printWaybills: boolean;
  /** Holds our stock on consignment, so a delivery is not yet a sale. */
  consignmentCustomer: boolean;
  /** Labels carry no sender's name — the customer resells the goods as its own. */
  neutralLabels: boolean;
  /** Every sawn piece gets its own label. */
  labelPerSawedPiece: boolean;
};

export type QuoteOrderPolicy = {
  /** A document without the customer's own reference is refused. */
  referenceRequired: boolean;
  /** Part deliveries are not accepted: everything ships together. */
  completeDelivery: boolean;
  roundWeightPerPieceUp: boolean;
  /** A certificate accompanies the goods as a matter of course. */
  certificateRequired: boolean;
  /** Over-length material is acceptable. */
  allowOverlength: boolean;
  /** New documents are pickup rather than delivery unless said otherwise. */
  defaultPickup: boolean;
};

export type EdiPolicy = {
  /** Product features travel with the EDI message. */
  sendProductFeatures: boolean;
  /** A PDF of the document is attached as well. */
  sendPdf: boolean;
};

/**
 * Whether one of a company's option arrays holds a given option. A null array —
 * a customer nobody has configured — holds nothing.
 */
export const hasSetting = <T extends string>(
  settings: readonly T[] | null | undefined,
  option: T,
): boolean => Boolean(settings?.includes(option));

/** What a customer's order settings waive. */
export const orderBlockingPolicy = (
  settings: readonly OrderOption[] | null | undefined,
): DocumentBlockingPolicy => ({
  commercialBlockingWaived: hasSetting(settings, "no_commercial_blocking"),
  financialBlockingWaived: hasSetting(settings, "no_financial_blockage"),
});

/** The same for its quote settings, which carry the two options separately. */
export const quoteBlockingPolicy = (
  settings: readonly QuoteOption[] | null | undefined,
): DocumentBlockingPolicy => ({
  commercialBlockingWaived: hasSetting(settings, "no_commercial_blocking"),
  financialBlockingWaived: hasSetting(settings, "no_financial_blockage"),
});

/** Everything the customer's settings decide about how a document prints. */
export const documentPrintPolicy = ({
  invoiceSettings,
  orderSettings,
  printProductCodes,
  groupLines,
}: {
  invoiceSettings?: readonly QuoteOrderInvoiceOption[] | null;
  orderSettings?: readonly OrderOption[] | null;
  printProductCodes?: PrintProductCodes | null;
  groupLines?: GroupLinesByDescription | null;
}): DocumentPrintPolicy => ({
  printPrices: !hasSetting(invoiceSettings, "do_not_print_prices"),
  totalAmountPerLine: hasSetting(invoiceSettings, "total_amount_per_line"),
  condenseOptions: hasSetting(invoiceSettings, "condensing_options"),
  optionPricesInMaterialPrices: hasSetting(
    invoiceSettings,
    "include_option_prices_in_material_prices",
  ),
  netPricesOnly: hasSetting(orderSettings, "net_prices_only"),
  scrapSurchargeSeparate: hasSetting(
    orderSettings,
    "scrap_surcharge_separately",
  ),
  productCode:
    printProductCodes === "print_easy2trade"
      ? "external"
      : printProductCodes === "print_company"
        ? "own"
        : printProductCodes === "do_not_print"
          ? "none"
          : "own",
  lineOrder:
    groupLines === "alphabetical_order"
      ? "alphabetical"
      : groupLines === "lowest_order_line"
        ? "lowest_line"
        : "entered",
  printGroupTitles: groupLines === "print_group_titles",
});

/** What a customer's miscellaneous settings say about it. */
export const customerMiscPolicy = (
  settings: readonly MiscellaneousOption[] | null | undefined,
): CustomerMiscPolicy => ({
  occasionalCustomer: hasSetting(settings, "occasional_customer"),
  hasPortalLogin: hasSetting(settings, "customer_has_login_code"),
  billOfLadingPerOrder: hasSetting(settings, "bill_of_ladings_per_order"),
  printWaybills: hasSetting(settings, "print_waybills"),
  consignmentCustomer: hasSetting(settings, "consignment_customer"),
  neutralLabels: hasSetting(settings, "neutral_labels"),
  labelPerSawedPiece: hasSetting(settings, "label_per_sawed_piece"),
});

/** What a customer's quote/order settings require of a new document. */
export const quoteOrderPolicy = (
  settings: readonly QuoteOrderOption[] | null | undefined,
): QuoteOrderPolicy => ({
  referenceRequired: hasSetting(settings, "reference_required"),
  completeDelivery: hasSetting(settings, "complete_delivery"),
  roundWeightPerPieceUp: hasSetting(settings, "round_weight_per_piece_up"),
  certificateRequired: hasSetting(settings, "certificate"),
  allowOverlength: hasSetting(settings, "overlength"),
  defaultPickup: hasSetting(settings, "default_pickup"),
});

/** What travels with a customer's EDI messages. */
export const ediPolicy = (
  settings: readonly EdiOption[] | null | undefined,
): EdiPolicy => ({
  sendProductFeatures: hasSetting(settings, "product_features"),
  sendPdf: hasSetting(settings, "send_pdf"),
});

/**
 * The key deliveries group into invoices by. Per delivery, one invoice each;
 * per order, everything from one order on one invoice; per order line, an
 * invoice for every line. Null when the customer has not said, which leaves the
 * caller to group as it always did.
 */
export const invoiceGroupKeyFor = (
  method: InvoicingMethod | null | undefined,
  ids: {
    deliveryUuid?: string | null;
    orderUuid?: string | null;
    orderItemUuid?: string | null;
  },
): string | null => {
  if (method === "per_delivery") {
    return ids.deliveryUuid ?? null;
  }
  if (method === "per_order") {
    return ids.orderUuid ?? null;
  }
  if (method === "per_order_line") {
    return ids.orderItemUuid ?? null;
  }
  return null;
};

/**
 * The next date an invoice run reaches this customer, counting from a
 * YYYY-MM-DD date: tomorrow when it is billed daily, next Monday when weekly,
 * the first of next month when monthly. Null on bad input.
 */
export const nextInvoiceRunDate = (
  frequency: InvoiceFrequency | null | undefined,
  from: string | null | undefined,
): string | null => {
  if (!from) {
    return null;
  }
  const date = new Date(`${from.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  if (frequency === "monthly") {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
      .toISOString()
      .split("T")[0];
  }
  if (frequency === "weekly") {
    // Monday is 1; a Monday rolls forward a full week rather than standing
    // still, because the run for this week has already gone out.
    const daysToMonday = (8 - date.getUTCDay()) % 7 || 7;
    date.setUTCDate(date.getUTCDate() + daysToMonday);
    return date.toISOString().split("T")[0];
  }
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().split("T")[0];
};

/**
 * Document lines in the order the customer's settings ask for: as entered, by
 * description, or by the lowest line number in each description's group — which
 * is what keeps the lines of one product group together while still leading
 * with whichever of them was typed first.
 */
export const orderDocumentLines = <T>(
  lines: readonly T[],
  policy: Pick<DocumentPrintPolicy, "lineOrder">,
  read: (line: T) => { description: string; lineNumber: number },
): T[] => {
  if (policy.lineOrder === "entered") {
    return [...lines];
  }
  if (policy.lineOrder === "alphabetical") {
    return [...lines].sort((a, b) =>
      read(a).description.localeCompare(read(b).description),
    );
  }
  const lowestByDescription = new Map<string, number>();
  for (const line of lines) {
    const { description, lineNumber } = read(line);
    const current = lowestByDescription.get(description);
    if (current === undefined || lineNumber < current) {
      lowestByDescription.set(description, lineNumber);
    }
  }
  return [...lines].sort((a, b) => {
    const left = read(a);
    const right = read(b);
    const byGroup =
      (lowestByDescription.get(left.description) ?? 0) -
      (lowestByDescription.get(right.description) ?? 0);
    return byGroup !== 0 ? byGroup : left.lineNumber - right.lineNumber;
  });
};

// ---------------------------------------------------------------------------
// Currencies and how money actually moved
//
// A currency was a label on the customer, so a limit agreed in dollars was
// printed with a euro sign, and a payment method was a label on the payment, so
// cash, a card and an offset all posted to the bank account. An offset moves no
// money at all — treating it as a bank receipt says the bank balance went up
// when nothing arrived.
// ---------------------------------------------------------------------------

export type CurrencyMeta = {
  /** ISO 4217 code, which is what Intl formats by. */
  code: string;
  symbol: string;
  decimals: number;
  /** The currency the ledger is kept in. Everything else needs converting. */
  isBase: boolean;
  /**
   * The smallest step cash can actually be paid in, in minor units. The
   * one-cent coins are gone in the euro area, so cash settles to the nearest
   * five; Hong Kong rounds to ten.
   */
  cashRoundingStep: number;
};

/** Where a settlement lands, named rather than numbered: the chart is server-side. */
export type SettlementAccountKey =
  | "bank"
  | "cash"
  | "card_clearing"
  | "offsets";

export type PaymentMethodMeta = {
  settlementAccount: SettlementAccountKey;
  /** Money is ours the same day, with nothing to clear. */
  settlesImmediately: boolean;
  /** Cannot be used without the counterparty's bank details on file. */
  requiresBankDetails: boolean;
  /** No money moves: the settlement is on paper against another document. */
  cashless: boolean;
  /** Working days before the money is actually available. */
  clearingDays: number;
};

export const CURRENCY_META: Record<Currency, CurrencyMeta> = {
  eur: {
    code: "EUR",
    symbol: "€",
    decimals: 2,
    isBase: true,
    cashRoundingStep: 5,
  },
  usd: {
    code: "USD",
    symbol: "$",
    decimals: 2,
    isBase: false,
    cashRoundingStep: 1,
  },
  gbp: {
    code: "GBP",
    symbol: "£",
    decimals: 2,
    isBase: false,
    cashRoundingStep: 1,
  },
  hkd: {
    code: "HKD",
    symbol: "HK$",
    decimals: 2,
    isBase: false,
    cashRoundingStep: 10,
  },
};

/** The currency the ledger is kept in. */
export const BASE_CURRENCY: Currency = "eur";

export const PAYMENT_METHOD_META: Record<PaymentMethod, PaymentMethodMeta> = {
  bank_transfer: {
    settlementAccount: "bank",
    settlesImmediately: false,
    requiresBankDetails: true,
    cashless: false,
    clearingDays: 1,
  },
  // We collect it ourselves, which is why it needs a mandate and why it can
  // still be pulled back for weeks.
  direct_debit: {
    settlementAccount: "bank",
    settlesImmediately: false,
    requiresBankDetails: true,
    cashless: false,
    clearingDays: 3,
  },
  cash: {
    settlementAccount: "cash",
    settlesImmediately: true,
    requiresBankDetails: false,
    cashless: false,
    clearingDays: 0,
  },
  // The acquirer holds it for a couple of days, so it sits in a clearing
  // account until the bank statement shows it.
  card: {
    settlementAccount: "card_clearing",
    settlesImmediately: false,
    requiresBankDetails: false,
    cashless: false,
    clearingDays: 2,
  },
  // Settled against another document rather than with money. Posting it to the
  // bank would say the balance went up when nothing arrived.
  offset: {
    settlementAccount: "offsets",
    settlesImmediately: true,
    requiresBankDetails: false,
    cashless: true,
    clearingDays: 0,
  },
};

/** What a currency is, falling back to the base currency when none is set. */
export const currencyMetaOf = (
  currency: Currency | null | undefined,
): CurrencyMeta => CURRENCY_META[currency ?? BASE_CURRENCY];

/** Whether an amount in this currency needs converting before it can be posted. */
export const needsCurrencyConversion = (
  currency: Currency | null | undefined,
): boolean => !currencyMetaOf(currency).isBase;

/**
 * An amount in a given currency, with that currency's own symbol and decimals.
 * A company that agreed a limit in dollars should not see it printed in euro.
 */
export const formatCurrencyAmount = (
  value: number | string | null | undefined,
  currency: Currency | null | undefined,
): string => {
  const meta = currencyMetaOf(currency);
  return `${meta.symbol} ${Number(value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  })}`;
};

/**
 * An amount rounded to the smallest step cash can be paid in — five cents in
 * the euro area, ten in Hong Kong, one where the smallest coin still exists.
 */
export const roundToCashStep = (
  value: number,
  currency: Currency | null | undefined,
): number => {
  const meta = currencyMetaOf(currency);
  const minorUnits = 10 ** meta.decimals;
  const step = meta.cashRoundingStep;
  return Math.round((value * minorUnits) / step) * (step / minorUnits);
};

/** Whether an amount can actually be handed over in cash in this currency. */
export const isPayableInCash = (
  value: number,
  currency: Currency | null | undefined,
): boolean => Math.abs(roundToCashStep(value, currency) - value) < 0.0005;

/** What a payment method implies, or null when a payment carries none. */
export const paymentMethodMetaOf = (
  method: PaymentMethod | null | undefined,
): PaymentMethodMeta | null => (method ? PAYMENT_METHOD_META[method] : null);

/**
 * Where a settlement by this method lands. Defaults to the bank, which is where
 * a payment nobody classified almost certainly arrived.
 */
export const settlementAccountFor = (
  method: PaymentMethod | null | undefined,
): SettlementAccountKey =>
  paymentMethodMetaOf(method)?.settlementAccount ?? "bank";

/** Whether money physically moves, as opposed to being netted on paper. */
export const paymentMovesMoney = (
  method: PaymentMethod | null | undefined,
): boolean => !paymentMethodMetaOf(method)?.cashless;

/** Whether this method cannot be used without bank details on file. */
export const paymentRequiresBankDetails = (
  method: PaymentMethod | null | undefined,
): boolean => Boolean(paymentMethodMetaOf(method)?.requiresBankDetails);

/**
 * The date the money is actually available, counting the method's clearing days
 * as working days from the payment date. Null on bad input.
 */
export const paymentClearsOn = (
  method: PaymentMethod | null | undefined,
  paymentDate: string | null | undefined,
): string | null =>
  addLeadTime(
    paymentDate,
    paymentMethodMetaOf(method)?.clearingDays ?? 0,
    "working_days",
  );

// ---------------------------------------------------------------------------
// How often a customer is called on, and in what language
//
// A company's A/B/C classification was a letter nobody read, so the visit
// schedule had no frequency to work from and every "next call" and "next visit"
// column on it was blank. The classification is exactly that frequency: an A
// customer is seen monthly and called fortnightly, a C customer twice a year.
//
// A customer's own visit frequency, where somebody has typed one, always wins —
// the classification is the default, not the rule.
// ---------------------------------------------------------------------------

export type CompanyClassificationMeta = {
  /** In-person visits a year. */
  visitsPerYear: number;
  /** Telephone calls a year. */
  callsPerYear: number;
  /** How often the credit limit is looked at again, in months. */
  creditReviewMonths: number;
};

export type VisitReasonMeta = {
  /** The visit needs a follow-up recorded before it can be closed. */
  needsFollowUp: boolean;
  /**
   * Weeks until the next visit this reason implies, or null when the reason
   * says nothing about when to come back — a first introduction does not.
   */
  nextVisitWeeks: number | null;
  /** The visit exists because of a complaint. */
  fromComplaint: boolean;
  /** The visit exists to chase a quote. */
  fromQuote: boolean;
};

export const COMPANY_CLASSIFICATION_META: Record<
  CompanyClassification,
  CompanyClassificationMeta
> = {
  A: { visitsPerYear: 12, callsPerYear: 26, creditReviewMonths: 6 },
  B: { visitsPerYear: 4, callsPerYear: 12, creditReviewMonths: 12 },
  C: { visitsPerYear: 2, callsPerYear: 4, creditReviewMonths: 24 },
};

export const VISIT_REASON_META: Record<VisitReportReason, VisitReasonMeta> = {
  // The schedule's own reason: come back when the frequency says so, which the
  // classification already answers.
  visit_frequency: {
    needsFollowUp: false,
    nextVisitWeeks: null,
    fromComplaint: false,
    fromQuote: false,
  },
  turnover_is_lagging_behind: {
    needsFollowUp: true,
    nextVisitWeeks: 8,
    fromComplaint: false,
    fromQuote: false,
  },
  complaint: {
    needsFollowUp: true,
    nextVisitWeeks: 4,
    fromComplaint: true,
    fromQuote: false,
  },
  quotation_follow_up: {
    needsFollowUp: true,
    nextVisitWeeks: 2,
    fromComplaint: false,
    fromQuote: true,
  },
  at_customers_request: {
    needsFollowUp: false,
    nextVisitWeeks: null,
    fromComplaint: false,
    fromQuote: false,
  },
  // A first call on somebody new. Whether to come back at all is the point of
  // the visit, so it fixes no interval.
  introduction: {
    needsFollowUp: true,
    nextVisitWeeks: null,
    fromComplaint: false,
    fromQuote: false,
  },
  // Somebody who does not buy yet. Same shape as an introduction: worth
  // following up, with no interval the reason itself can fix.
  potential_customer_prospect: {
    needsFollowUp: true,
    nextVisitWeeks: null,
    fromComplaint: false,
    fromQuote: false,
  },
};

/** What a classification implies, or null when a company carries none. */
export const classificationMetaOf = (
  classification: CompanyClassification | null | undefined,
): CompanyClassificationMeta | null =>
  classification ? COMPANY_CLASSIFICATION_META[classification] : null;

/** What a visit reason implies, or null when a report carries none. */
export const visitReasonMetaOf = (
  reason: VisitReportReason | null | undefined,
): VisitReasonMeta | null => (reason ? VISIT_REASON_META[reason] : null);

/**
 * Weeks between contacts of a given kind: the customer's own frequency where
 * one is set, otherwise the one its classification implies. Null when neither
 * says anything, which is what keeps an unclassified customer off the due list
 * rather than putting it there every day.
 */
export const contactIntervalWeeks = (
  kind: VisitReportContactMethod,
  {
    classification,
    visitsPerYear,
    callsPerYear,
  }: {
    classification?: CompanyClassification | null;
    visitsPerYear?: number | null;
    callsPerYear?: number | null;
  },
): number | null => {
  const own = kind === "visit" ? visitsPerYear : callsPerYear;
  const meta = classificationMetaOf(classification);
  const perYear =
    own && own > 0
      ? own
      : kind === "visit"
        ? (meta?.visitsPerYear ?? 0)
        : (meta?.callsPerYear ?? 0);
  if (perYear <= 0) {
    return null;
  }
  return Math.max(1, Math.round(52 / perYear));
};

/**
 * When the next contact of this kind is due: the last one plus the interval, or
 * today when there has never been one — somebody nobody has ever called is due
 * now, not never. Null when no interval applies.
 */
export const nextContactDate = (
  lastContact: string | null | undefined,
  intervalWeeks: number | null,
  today: string,
): string | null => {
  if (intervalWeeks === null) {
    return null;
  }
  if (!lastContact) {
    return today;
  }
  return addLeadTime(lastContact.slice(0, 10), intervalWeeks, "weeks");
};

/** Whether a due date has arrived. A date nobody could compute is not due. */
export const isContactDue = (dueDate: string | null, today: string): boolean =>
  Boolean(dueDate) && (dueDate ?? "") <= today;

/**
 * When the credit limit should next be looked at, from the date it was last
 * set. An unclassified customer gets no review date rather than an invented
 * one.
 */
export const nextCreditReviewDate = (
  classification: CompanyClassification | null | undefined,
  lastReviewed: string | null | undefined,
): string | null => {
  const meta = classificationMetaOf(classification);
  if (!meta || !lastReviewed) {
    return null;
  }
  return addLeadTime(
    lastReviewed.slice(0, 10),
    meta.creditReviewMonths,
    "months",
  );
};

/**
 * The date a visit's reason says to come back, or null when the reason fixes no
 * interval — an introduction and a visit the customer asked for both leave the
 * next one to be decided.
 */
export const nextVisitDateForReason = (
  reason: VisitReportReason | null | undefined,
  visitDate: string | null | undefined,
): string | null => {
  const weeks = visitReasonMetaOf(reason)?.nextVisitWeeks ?? null;
  if (weeks === null || !visitDate) {
    return null;
  }
  return addLeadTime(visitDate.slice(0, 10), weeks, "weeks");
};

/**
 * The same, for the several reasons one visit may carry — the reference's
 * `Bezoekredenen` is a list, and two of its 166 rows name more than one. The
 * soonest date wins: a visit made both because turnover is slipping (8 weeks)
 * and to chase a quote (2 weeks) is due back in 2, because the quote will not
 * wait for the turnover.
 */
/**
 * A visit's reasons as one line, the way the reference's `Bezoekredenen` column
 * writes them: the labels of the reasons it carries, comma separated, and null
 * when it carries none.
 */
export const visitReasonsLabel = (
  reasons: readonly VisitReportReason[] | null | undefined,
): string | null =>
  reasons && reasons.length > 0
    ? reasons.map((reason) => VISIT_REPORT_REASON_LABELS[reason]).join(", ")
    : null;

export const nextVisitDateForReasons = (
  reasons: readonly VisitReportReason[] | null | undefined,
  visitDate: string | null | undefined,
): string | null =>
  (reasons ?? [])
    .map((reason) => nextVisitDateForReason(reason, visitDate))
    .filter((date): date is string => date !== null)
    .reduce<string | null>(
      (soonest, date) => (soonest === null || date < soonest ? date : soonest),
      null,
    );

/** The locale a customer's documents are written in. */
export const documentLocale = (
  language: CompanyLang | null | undefined,
): string => {
  if (language === "dutch") {
    return "nl-NL";
  }
  if (language === "arabic") {
    return "ar";
  }
  return "en-GB";
};

/** Whether a customer's documents read right-to-left. */
export const isRightToLeftLanguage = (
  language: CompanyLang | null | undefined,
): boolean => language === "arabic";

/**
 * The greeting a document opens with, in the contact's own language. Falls back
 * to a name-only greeting where no salutation is recorded, rather than guessing
 * one.
 */
export const salutationLine = (
  salutation: ContactSalutation | null | undefined,
  language: CompanyLang | null | undefined,
  lastName: string | null | undefined,
): string => {
  const name = (lastName ?? "").trim();
  const dutch = language === "dutch";
  const arabic = language === "arabic";
  if (!salutation) {
    if (arabic) {
      return name ? `تحية طيبة ${name}` : "تحية طيبة";
    }
    if (dutch) {
      return name ? `Geachte ${name}` : "Geachte heer, mevrouw";
    }
    return name ? `Dear ${name}` : "Dear Sir or Madam";
  }
  if (arabic) {
    const title = salutation === "mr" ? "السيد" : "السيدة";
    return name ? `${title} ${name}` : title;
  }
  if (dutch) {
    const title = salutation === "mr" ? "heer" : "mevrouw";
    return name ? `Geachte ${title} ${name}` : `Geachte ${title}`;
  }
  const title = salutation === "mr" ? "Mr" : "Mrs";
  return name ? `Dear ${title} ${name}` : `Dear ${title}`;
};

/**
 * What has to be at the delivery address to get the goods off the lorry — and
 * therefore what kind of vehicle has to bring them. A site that unloads by
 * crane needs a lorry with one.
 */
export const unloadingRequirements = (
  available: AvailableAt | null | undefined,
): { needsVehicleWithCrane: boolean; unloadsByForklift: boolean } => ({
  needsVehicleWithCrane: available === "crane_unloading",
  unloadsByForklift: available === "forklift_unloading",
});

// ---------------------------------------------------------------------------
// What a purchase order is for, and what a tier is measured against
//
// A purchase order type said whether we were buying metal, buying a processing
// step, or having a customer's own metal worked on — three different things
// that nonetheless all posted to inventory and all expected a goods receipt.
// Only the first buys stock: paying a processor buys labour, and a customer's
// material was never ours to capitalise.
//
// The fiscal basis is the same kind of decision on the invoice: the period a
// purchase invoice lands in is either the date it was booked or the date the
// supplier put on it, and the column that says which was never read.
// ---------------------------------------------------------------------------

export type PurchaseOrderTypeMeta = {
  /** The goods become our stock, so the invoice capitalises rather than expenses. */
  becomesStock: boolean;
  /** Goods physically arrive, so a receipt is expected against the order. */
  expectsGoodsReceipt: boolean;
  /** What is bought is work on material rather than the material itself. */
  buysProcessing: boolean;
  /** The material belongs to the customer throughout. */
  customerOwnedMaterial: boolean;
};

export const PURCHASE_ORDER_TYPE_META: Record<
  PurchaseOrderType,
  PurchaseOrderTypeMeta
> = {
  materials: {
    becomesStock: true,
    expectsGoodsReceipt: true,
    buysProcessing: false,
    customerOwnedMaterial: false,
  },
  // A processor's invoice buys labour on metal we already own. The labour is a
  // cost of the goods, not a second lot of goods.
  processing: {
    becomesStock: false,
    expectsGoodsReceipt: false,
    buysProcessing: true,
    customerOwnedMaterial: false,
  },
  // The customer's own metal, worked on and sent back. It arrives and leaves
  // again, and it was never ours to put a value on.
  customer_materials: {
    becomesStock: false,
    expectsGoodsReceipt: true,
    buysProcessing: true,
    customerOwnedMaterial: true,
  },
};

/** What a purchase order type implies, or null when an order carries none. */
export const purchaseOrderTypeMetaOf = (
  type: PurchaseOrderType | null | undefined,
): PurchaseOrderTypeMeta | null =>
  type ? PURCHASE_ORDER_TYPE_META[type] : null;

/**
 * Whether the goods on this kind of order become stock we own. Defaults to true
 * when no type is set, since an untyped purchase order is a material order —
 * which is what the system did before types were read at all.
 */
export const purchaseBecomesStock = (
  type: PurchaseOrderType | null | undefined,
): boolean => purchaseOrderTypeMetaOf(type)?.becomesStock ?? true;

/**
 * The date a purchase invoice's fiscal period is taken from: the date it was
 * booked, or the date the supplier put on the document. Falls back to whichever
 * of the two is present, because a period has to come from somewhere.
 */
export const fiscalPeriodDate = (
  basis: PurchaseInvoiceFiscalBase | null | undefined,
  dates: {
    bookingDate?: Date | string | null;
    documentDate?: Date | string | null;
  },
): Date | string | null => {
  if (basis === "document_date") {
    return dates.documentDate ?? dates.bookingDate ?? null;
  }
  return dates.bookingDate ?? dates.documentDate ?? null;
};

/**
 * How many pieces one purchasing unit is. `ST` is a piece; `HS` is a hundred of
 * them, which is why a quantity of 3 in HS is 300 pieces and a price per HS is a
 * hundredth of a price per piece.
 */
export const purchasingUnitPieces = (
  unit: PurchasingUnit | null | undefined,
): number => (unit === "HS" ? 100 : 1);

/** A quantity expressed in a purchasing unit, converted to pieces. */
export const purchasingUnitToPieces = (
  quantity: number,
  unit: PurchasingUnit | null | undefined,
): number => quantity * purchasingUnitPieces(unit);

/** A price per purchasing unit, converted to a price per piece. */
export const purchasingUnitPricePerPiece = (
  price: number,
  unit: PurchasingUnit | null | undefined,
): number => price / purchasingUnitPieces(unit);

/**
 * The key a price tier, surcharge or discount is accumulated against: the
 * single order line, the group product, or the whole product group. Null when
 * the basis names something the caller has no id for, which is what stops a
 * tier being applied against the wrong total.
 */
export const tierAccumulationKey = (
  basis: PriceTierBase | ContractSurchargePerType | null | undefined,
  ids: {
    orderLineUuid?: string | null;
    groupProductUuid?: string | null;
    productGroupUuid?: string | null;
  },
): string | null => {
  if (basis === "order_line") {
    return ids.orderLineUuid ?? null;
  }
  if (basis === "group_product") {
    return ids.groupProductUuid ?? null;
  }
  if (basis === "product_group") {
    return ids.productGroupUuid ?? null;
  }
  return null;
};

/** The same for a contract discount, which is measured against two of the three. */
export const discountAccumulationKey = (
  basis: ContractDiscountBasedOnType | null | undefined,
  ids: { groupProductUuid?: string | null; productGroupUuid?: string | null },
): string | null =>
  tierAccumulationKey(basis, {
    groupProductUuid: ids.groupProductUuid,
    productGroupUuid: ids.productGroupUuid,
  });

// ---------------------------------------------------------------------------
// Standards and the certificates they demand
//
// A CE standard was a dropdown on the product and nothing more, so a structural
// hollow section — a CE-marked product that may not leave without its
// inspection certificate — was released on exactly the same terms as a length
// of ordinary bar. Every certificate expectation was opened with "mandatory,
// ignore document" set, meaning no consignment was ever actually held for its
// paperwork.
//
// A standard says three things: what kind of product it governs, whether the
// product is CE marked and therefore needs a Declaration of Performance, and
// which grade of EN 10204 certificate has to travel with it.
// ---------------------------------------------------------------------------

export type CeStandardMeta = {
  /** What the standard governs. */
  scope:
    | "threaded_tube"
    | "hollow_section_cold_formed"
    | "hollow_section_hot_finished"
    | "structural_steel";
  /**
   * The product is CE marked under the Construction Products Regulation, so a
   * Declaration of Performance travels with it.
   */
  requiresDeclarationOfPerformance: boolean;
  /** The EN 10204 certificate the standard demands. */
  requiredCertificate: CertificaatOption;
  /** The execution standard the product is CE marked under, where there is one. */
  executionStandard: string | null;
};

export type QualityStandardMeta = {
  /** What the standard fixes. */
  governs: "mechanical_properties" | "dimensions_and_tolerances";
  /** The dimensional tolerance standard that goes with it. */
  toleranceStandard: string;
};

export const CE_STANDARD_META: Record<CeStandard, CeStandardMeta> = {
  // Non-alloy steel tubes for welding and threading. CE marked, and bought with
  // a works certificate rather than an inspection one.
  en_10255: {
    scope: "threaded_tube",
    requiresDeclarationOfPerformance: true,
    requiredCertificate: "en10204_2_1",
    executionStandard: null,
  },
  // Cold formed welded structural hollow sections. Structural: it goes into a
  // load-bearing frame, so it needs an inspection certificate with real test
  // results on it, not a declaration of compliance.
  en_10219_1: {
    scope: "hollow_section_cold_formed",
    requiresDeclarationOfPerformance: true,
    requiredCertificate: "en10204_3_1",
    executionStandard: "EN 1090-2",
  },
  // Hot finished structural hollow sections. Same duty.
  en_10210_1: {
    scope: "hollow_section_hot_finished",
    requiresDeclarationOfPerformance: true,
    requiredCertificate: "en10204_3_1",
    executionStandard: "EN 1090-2",
  },
  // Hot rolled structural steel, general delivery conditions.
  en_10025_1: {
    scope: "structural_steel",
    requiresDeclarationOfPerformance: true,
    requiredCertificate: "en10204_3_1",
    executionStandard: "EN 1090-2",
  },
};

export const QUALITY_STANDARD_META: Record<
  ProductQualityStandard,
  QualityStandardMeta
> = {
  en_10025_2: {
    governs: "mechanical_properties",
    toleranceStandard: "EN 10029",
  },
  en_10219_1: {
    governs: "dimensions_and_tolerances",
    toleranceStandard: "EN 10219-2",
  },
};

/** What a CE standard implies, or null when a product carries none. */
export const ceStandardMetaOf = (
  standard: CeStandard | null | undefined,
): CeStandardMeta | null => (standard ? CE_STANDARD_META[standard] : null);

/** What a quality standard implies, or null when a product carries none. */
export const qualityStandardMetaOf = (
  standard: ProductQualityStandard | null | undefined,
): QualityStandardMeta | null =>
  standard ? QUALITY_STANDARD_META[standard] : null;

/**
 * Whether goods under this standard may not leave until their certificate is on
 * hand. A CE-marked product may not: the certificate is part of what makes the
 * marking true. A product under no CE standard travels on the usual terms.
 */
export const certificateIsMandatory = (
  standard: CeStandard | null | undefined,
): boolean =>
  Boolean(ceStandardMetaOf(standard)?.requiresDeclarationOfPerformance);

/**
 * The certificate a consignment has to carry.
 *
 * The CE standard wins where there is one — a structural section needs its 3.1
 * whatever the purchase line was ordered under. Failing that, the product's own
 * setting, and failing that the 2.1 declaration of compliance that always
 * accompanies the goods.
 */
export const requiredCertificateFor = ({
  ceStandard,
  productCertificate,
  orderedCertificate,
}: {
  ceStandard?: CeStandard | null;
  productCertificate?: CertificaatOption | null;
  orderedCertificate?: CertificaatOption | null;
}): CertificaatOption => {
  const required = ceStandardMetaOf(ceStandard)?.requiredCertificate;
  if (required === "en10204_3_1") {
    return required;
  }
  // A 3.1 already promised on the order or on the product is never downgraded:
  // somebody agreed to supply one.
  if (
    orderedCertificate === "en10204_3_1" ||
    productCertificate === "en10204_3_1"
  ) {
    return "en10204_3_1";
  }
  return required ?? productCertificate ?? orderedCertificate ?? "en10204_2_1";
};

// ---------------------------------------------------------------------------
// The remaining settings that decide something
//
// The last of the picklists that were only ever written and read back: which
// lot leaves the shelf first, what a tier threshold is measured in, when a
// machine-day is full, where a warehouse actually stands, and how a document
// leaves the building.
// ---------------------------------------------------------------------------

export type WarehouseAddressMeta = {
  /** Our own site, as opposed to space taken at a port. */
  ownSite: boolean;
  /** Goods clear customs here, so an import needs paperwork before release. */
  clearsCustoms: boolean;
  /** The transport region the site sits in. */
  transportRegion: WarehouseTransportRegion;
  city: string;
};

export type WarehouseProductTypeMeta = {
  /** Handled by crane rather than by forklift. */
  needsCrane: boolean;
  /** Stored standing in a rack rather than stacked flat. */
  storedInRack: boolean;
  /** The cross-section its articles are weighed with. */
  dimensionShape: ProductDimensionShape;
};

export type CommunicationChannelMeta = {
  /** Reaches the customer over a network rather than on paper. */
  electronic: boolean;
  /** A machine at the other end reads it, so the format has to be a data one. */
  machineReadable: boolean;
  /** Needs an address of some kind before it can be sent. */
  needsAddress: boolean;
};

export type CommunicationFormatMeta = {
  /** A person reads it; the rest are for a system. */
  humanReadable: boolean;
  /** Carries structured data a machine can post straight into its own ledger. */
  structured: boolean;
};

export const WAREHOUSE_ADDRESS_META: Record<
  WarehouseAddress,
  WarehouseAddressMeta
> = {
  hego_almere: {
    ownSite: true,
    clearsCustoms: false,
    transportRegion: "ned",
    city: "Almere",
  },
  // A port site: goods land here from outside the union and are cleared before
  // they go anywhere.
  port_of_rotterdam: {
    ownSite: false,
    clearsCustoms: true,
    transportRegion: "ned",
    city: "Rotterdam",
  },
  port_of_antwerp: {
    ownSite: false,
    clearsCustoms: true,
    transportRegion: "bel",
    city: "Antwerp",
  },
};

export const WAREHOUSE_PRODUCT_TYPE_META: Record<
  WarehouseProductType,
  WarehouseProductTypeMeta
> = {
  beam: { needsCrane: true, storedInRack: true, dimensionShape: "beam" },
  tube: { needsCrane: false, storedInRack: true, dimensionShape: "tube_round" },
  sheet: { needsCrane: true, storedInRack: false, dimensionShape: "sheet" },
  profile: { needsCrane: false, storedInRack: true, dimensionShape: "angle" },
  bar: { needsCrane: false, storedInRack: true, dimensionShape: "round" },
};

export const COMMUNICATION_CHANNEL_META: Record<
  CommunicationSettingType,
  CommunicationChannelMeta
> = {
  email: { electronic: true, machineReadable: false, needsAddress: true },
  fax: { electronic: true, machineReadable: false, needsAddress: true },
  // The one channel that reaches nobody by itself: it comes out of a printer
  // here and somebody has to carry it.
  printing: { electronic: false, machineReadable: false, needsAddress: false },
  edi_ftp: { electronic: true, machineReadable: true, needsAddress: true },
  edi_http: { electronic: true, machineReadable: true, needsAddress: true },
  edi_https: { electronic: true, machineReadable: true, needsAddress: true },
};

export const COMMUNICATION_FORMAT_META: Record<
  CommunicationSettingShape,
  CommunicationFormatMeta
> = {
  pdf: { humanReadable: true, structured: false },
  text: { humanReadable: true, structured: false },
  scsn: { humanReadable: false, structured: true },
  sales_in_the_construction: { humanReadable: false, structured: true },
  edi4steel: { humanReadable: false, structured: true },
  peppol: { humanReadable: false, structured: true },
};

/** What a warehouse address implies, or null when none is set. */
export const warehouseAddressMetaOf = (
  address: WarehouseAddress | null | undefined,
): WarehouseAddressMeta | null =>
  address ? WAREHOUSE_ADDRESS_META[address] : null;

/** What a warehouse product type implies, or null when none is set. */
export const warehouseProductTypeMetaOf = (
  type: WarehouseProductType | null | undefined,
): WarehouseProductTypeMeta | null =>
  type ? WAREHOUSE_PRODUCT_TYPE_META[type] : null;

/**
 * Whether a channel and a format can actually be used together. An EDI link
 * expects data, not a PDF of a document, and a printer cannot print a Peppol
 * envelope. A setting with only one half chosen is not yet wrong.
 */
export const communicationSetupIsCoherent = (
  channel: CommunicationSettingType | null | undefined,
  format: CommunicationSettingShape | null | undefined,
): boolean => {
  if (!channel || !format) {
    return true;
  }
  const channelMeta = COMMUNICATION_CHANNEL_META[channel];
  const formatMeta = COMMUNICATION_FORMAT_META[format];
  if (channelMeta.machineReadable) {
    return formatMeta.structured;
  }
  return formatMeta.humanReadable;
};

/**
 * Which lot leaves first. LIFO dispatches the newest receipt, FIFO the oldest;
 * a product that says nothing is dispatched oldest first, which is what keeps
 * metal from ageing on the shelf.
 */
export const dispatchOrderFor = (
  strategy: DispatchStrategy | null | undefined,
): "newest_first" | "oldest_first" =>
  strategy === "lifo" ? "newest_first" : "oldest_first";

/**
 * Lots in the order the product's dispatch strategy takes them: newest receipt
 * first under LIFO, oldest first under FIFO. Lots with no receipt date sort
 * last either way — an undated lot is not evidence of being the oldest.
 */
export const sortLotsForDispatch = <
  T extends { receiptDate?: string | null; id?: number | null },
>(
  lots: readonly T[],
  strategy: DispatchStrategy | null | undefined,
): T[] => {
  const newestFirst = dispatchOrderFor(strategy) === "newest_first";
  return [...lots].sort((a, b) => {
    const left = a.receiptDate ?? "";
    const right = b.receiptDate ?? "";
    if (left === right) {
      return (a.id ?? 0) - (b.id ?? 0);
    }
    if (!left) {
      return 1;
    }
    if (!right) {
      return -1;
    }
    return newestFirst ? right.localeCompare(left) : left.localeCompare(right);
  });
};

/**
 * The figure a contract tier's threshold is compared against: tonnes when the
 * tier is measured in TN, money when it is measured in Euro. Null when the
 * caller has no figure for the unit named, which leaves the tier unapplied
 * rather than applied against the wrong number.
 */
export const tierThresholdValue = (
  unit: ContractTierUnit | null | undefined,
  measures: { tonnes?: number | null; amount?: number | null },
): number | null => {
  if (unit === "TN") {
    return measures.tonnes ?? null;
  }
  if (unit === "Euro") {
    return measures.amount ?? null;
  }
  return null;
};

/**
 * How full a machine-day is, from what is booked against the ceiling and the
 * warning threshold. Full at or above the maximum, warning at or above the
 * warning line, otherwise fine. With no maximum recorded there is nothing to be
 * full of, so it reads as fine.
 */
export const productionCapacityStatusFor = ({
  occupied,
  warning,
  maximum,
}: {
  occupied: number | null;
  warning: number | null;
  maximum: number | null;
}): ProductionCapacityStatus => {
  if (occupied === null) {
    return "ok";
  }
  if (maximum !== null && maximum > 0 && occupied >= maximum) {
    return "full";
  }
  if (warning !== null && warning > 0 && occupied >= warning) {
    return "warning";
  }
  return "ok";
};

/** Whether a counter order jumps the queue. */
export const counterOrderIsUrgent = (
  priority: CounterOrderPriority | null | undefined,
): boolean => priority === "rush";

/**
 * Where a counter order sits in the picking queue — a rush order ahead of
 * everything normal. Lower sorts first.
 */
export const counterOrderQueueRank = (
  priority: CounterOrderPriority | null | undefined,
): number => (counterOrderIsUrgent(priority) ? 0 : 1);

/**
 * What a visit report category commits us to: whether the customer asked for
 * another visit, whether it follows a complaint, and whether it counts toward
 * acquisition rather than account care.
 */
export const visitCategoryMeta = (
  category: VisitReportCategory | null | undefined,
): {
  expectsNextVisit: boolean;
  followsComplaint: boolean;
  countsAsAcquisition: boolean;
} => ({
  expectsNextVisit: category === "wishing_next_visit",
  followsComplaint: category === "following_complaint",
  countsAsAcquisition: category === "acquisition",
});

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

/**
 * The representative's initials, the way the customer overview prints them.
 *
 * The reference fills this column on exactly the three customers whose
 * representative is a named person, and leaves it empty for the desk names
 * (`Hego`, `Export`, `BNL`) — so it is the initials of a personal name, not a
 * stored field. A single-word representative is a desk, and gets none.
 */
export const representativeInitials = (
  value: SalesRepresentative | string | null | undefined,
): string | null => {
  if (!value) {
    return null;
  }
  const words = salesRepresentativeLabel(value).split(" ").filter(Boolean);
  if (words.length < 2) {
    return null;
  }
  return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
};

/**
 * The half-hour window a document was created in, as the reference prints it.
 *
 * Derived, never stored: the creation time floored to the half hour and
 * written `HH:MM - HH:MM`. It reproduces all 2 091 rows of the reference's own
 * `Time frame` column.
 */
export const timeFrameOf = (value: Date | string): string => {
  const at = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(at.getTime())) {
    return "";
  }
  const half = at.getMinutes() < 30 ? 0 : 30;
  const startHours = String(at.getHours()).padStart(2, "0");
  const endMinutes = half === 0 ? 30 : 0;
  const endHours = String(
    half === 0 ? at.getHours() : (at.getHours() + 1) % 24,
  ).padStart(2, "0");
  return `${startHours}:${String(half).padStart(2, "0")} - ${endHours}:${String(
    endMinutes,
  ).padStart(2, "0")}`;
};

/**
 * A sales document's status as a label.
 *
 * The four series run their own status lists, so a value the order ladder does
 * not know is printed as it stands rather than dropped.
 */
export const salesDocumentStatusLabel = (
  status: string | null,
): string | null =>
  status ? (ORDER_STATUS_LABELS[status as OrderStatus] ?? status) : null;

/**
 * What a sales line is charged **per**, in the unit it is priced in.
 *
 * One formula per price unit, proved on 4 571 of the reference's 4 975 order
 * lines and on every single `ST`, `M1` and `HK` row:
 *
 *     TN -> kilos / 1000     KG -> kilos
 *     HK -> kilos / 100      ST -> pieces
 *     M1 -> pieces x length in metres
 *
 * `Amount = basis x net price`, and `Profit = Amount - cost price x basis`.
 * The cost is measured in the **line's** unit, not the product's: using the
 * product's drops the fit from 98.5 % to 91 % and leaves errors in the
 * thousands.
 *
 * The 400 `TN` rows that miss are nearly all invoiced, and they are billed on
 * what actually left the warehouse rather than on the line's own weight.
 */
export const priceBasis = (
  priceUnit: string | null | undefined,
  line: { weightKg: number; quantity: number; lengthMm?: number | null },
): number => {
  switch (priceUnit) {
    case "TN":
      return line.weightKg / 1000;
    case "KG":
      return line.weightKg;
    case "HK":
      return line.weightKg / 100;
    case "M1":
      return (line.quantity * (line.lengthMm ?? 0)) / 1000;
    default:
      return line.quantity;
  }
};

/**
 * How many of the product's own unit one piece weighs.
 *
 * The bridge between the two units a line carries: what the customer is billed
 * in and what the product is held in. Proved on all 841 of the reference's
 * lines where they differ -- 632 `ST` sold against a tonne-held product, 209
 * against a `HK` one, no exceptions.
 */
export const unitsPerPiece = (
  productPriceUnit: string | null | undefined,
  line: { weightKg: number; quantity: number },
): number => {
  if (line.quantity === 0) {
    return 0;
  }
  const kilosPerPiece = line.weightKg / line.quantity;
  switch (productPriceUnit) {
    case "TN":
      return kilosPerPiece / 1000;
    case "HK":
      return kilosPerPiece / 100;
    case "KG":
      return kilosPerPiece;
    default:
      return 1;
  }
};

/**
 * The net price restated in the unit the **product** is held in.
 *
 * Where the two units are the same the price is unchanged, which is what the
 * reference shows on all 4 134 of its matching rows.
 */
export const netPriceInProductUnit = (
  netPrice: number,
  priceUnit: string | null | undefined,
  productPriceUnit: string | null | undefined,
  line: { weightKg: number; quantity: number },
): number => {
  if (!priceUnit || !productPriceUnit || priceUnit === productPriceUnit) {
    return netPrice;
  }
  const per = unitsPerPiece(productPriceUnit, line);
  return per === 0 ? netPrice : netPrice / per;
};

/**
 * The cost price restated in the unit the product is held in.
 *
 * 🔴 The reference does **not** do this. Its `Price -/- Cost price` column
 * subtracts the cost straight from the net price in the product's unit -- euros
 * per piece from euros per tonne -- and reconciles on all 4 975 rows because
 * both sides of its own subtraction are wrong together. Order `O100220` line
 * 20 reads 5 466.32 where the real per-tonne margin is about 760. The column is
 * carried here with the cost converted first, so ours disagrees with theirs on
 * the 841 lines where the units differ, and is right on all of them.
 */
export const costPriceInProductUnit = (
  costPrice: number,
  priceUnit: string | null | undefined,
  productPriceUnit: string | null | undefined,
  line: { weightKg: number; quantity: number },
): number => {
  if (!priceUnit || !productPriceUnit || priceUnit === productPriceUnit) {
    return costPrice;
  }
  const per = unitsPerPiece(productPriceUnit, line);
  return per === 0 ? costPrice : costPrice / per;
};

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

/**
 * The label for a status on a screen carrying both purchase documents.
 *
 * An order and a quote each walk their own ladder, and the two share no values,
 * so which map to read follows from the kind of document rather than from the
 * value — that is what let a quote's status read blank when the screen only
 * knew the order ladder.
 */
export const documentStatusLabel = (
  kind: "Order" | "Quote",
  value: string | null | undefined,
): string => {
  if (!value) {
    return "—";
  }
  return kind === "Quote"
    ? (PURCHASE_QUOTE_STATUS_LABELS[value as PurchaseQuoteStatus] ?? value)
    : (PURCHASE_ORDER_STATUS_LABELS[value as PurchaseOrderStatus] ?? value);
};

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
 * A weight restated in whichever unit a product is bought by.
 *
 * The order-advice grid mixes units on purpose: the position and the demand are
 * in kilos, because that is what the shop weighs, while the advice and the
 * order are in the unit the supplier sells by — a mill quotes tonnes, so 28 kg
 * of stock reads as 0,03 on the purchase-unit column.
 *
 * Two factors carry the whole list. A weight per piece answers the counted
 * units, a weight per running metre the measured ones, and the hundred-unit
 * codes are those two divided by a hundred. `M2` has neither factor, so it
 * converts to nothing.
 *
 * Null where the factor is not something the product records. Guessing one
 * would put a number in front of a buyer that looks like an order quantity and
 * is not, which is worse than an empty cell.
 */
export const convertKgToUnit = (
  kg: number,
  unit: SalesUnit | PurchasingUnit | null | undefined,
  weightPerPiece: number | null,
  weightPerM1: number | null,
): number | null => {
  const pieces =
    weightPerPiece && weightPerPiece > 0 ? kg / weightPerPiece : null;
  const metres = weightPerM1 && weightPerM1 > 0 ? kg / weightPerM1 : null;

  switch (unit) {
    case "KG":
      return kg;
    case "HK":
      return kg / 100;
    case "TN":
      return kg / 1000;
    case "ST":
      return pieces;
    case "HS":
      return pieces === null ? null : pieces / 100;
    case "M1":
      return metres;
    case "HM":
      return metres === null ? null : metres / 100;
    case "MM":
      return metres === null ? null : metres * 1000;
    default:
      return null;
  }
};

/**
 * The advised weight as the buyer is shown it. Steel is not bought to the gram,
 * so the advice is a whole number of kilos.
 */
export const roundAdviceWeight = (kg: number): number =>
  kg > 0 ? Math.round(kg) : 0;

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
 * A supplier's delivery time as calendar days, whatever unit it was agreed in.
 *
 * Everything the reorder policy does is struck in days, because the demand it
 * covers accrues every day — including the ones nobody works. So working days
 * are stretched back onto the calendar at five to the week rather than counted
 * as they stand: a ten-working-day lead time is a fortnight of consumption, not
 * ten days of it.
 */
export const deliveryTimeInDays = (
  value: number | null | undefined,
  unit: DeliveryTimeUnit | null | undefined,
): number => {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }
  switch (unit) {
    case "months":
      return Math.round(amount * 30);
    case "weeks":
      return amount * 7;
    case "working_days":
      return Math.round((amount * 7) / 5);
    default:
      return amount;
  }
};

/**
 * Working days from today up to a date, counting Monday to Friday and excluding
 * today itself — "how many more working days have I got before this lands".
 *
 * A date that has already passed answers 0 rather than a negative: the receipt
 * is overdue, and no amount of counting backwards makes it less so.
 */
export const workingDaysUntil = (
  date: string | Date | null | undefined,
  from: Date = new Date(),
): number | null => {
  if (!date) {
    return null;
  }
  const target = date instanceof Date ? new Date(date) : new Date(`${date}`);
  if (Number.isNaN(target.getTime())) {
    return null;
  }

  // Whole days since the epoch, so the count is arithmetic rather than a walk
  // through a calendar: a date a decade out must not cost ten thousand steps.
  // Both ends are taken at midnight local time, because a receipt due tomorrow
  // is due tomorrow whatever o'clock it is now.
  const dayNumber = (value: Date): number =>
    Math.floor(
      Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) /
        86_400_000,
    );

  const start = dayNumber(from);
  const span = dayNumber(target) - start;
  if (span <= 0) {
    return 0;
  }

  // Every whole week contributes its five, and only the days that do not make
  // up a week have to be looked at one by one.
  const wholeWeeks = Math.floor(span / 7);
  const remainder = Array.from(
    { length: span % 7 },
    // The epoch fell on a Thursday, so day n is weekday (n + 4) mod 7.
    (_, offset) => (start + wholeWeeks * 7 + offset + 1 + 4) % 7,
  ).filter((weekday) => weekday !== 0 && weekday !== 6).length;

  return wholeWeeks * 5 + remainder;
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
/**
 * The line type a purchase order header implies for its lines.
 *
 * `Pick up/Drop-off CD-purchases` ticked on the header is the buying end of a
 * cross-dock — our lorry collects at the supplier and drops at the customer —
 * so a line raised under it is `CD` unless the buyer says otherwise. Nothing on
 * the header says `EXW`; that is chosen on the line, which is why this returns
 * a default rather than the answer.
 */
export const purchaseSourceTypeFor = (
  pickupDropoffCdPurchases: boolean | null | undefined,
): PurchaseSourceType => (pickupDropoffCdPurchases ? "cross_dock" : "stock");

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
  /**
   * The fixed settlement price the article is carried at, when one is in force.
   * A third basis the same line is measured against — the reference prints
   * profit against APP, FSP and the replacement price side by side, because a
   * line can look healthy against what it cost and poor against what the
   * business has decided the metal is worth.
   */
  fspPrice?: number;
  /** Weight of one unit as the physics gives it. This is what the line costs. */
  theoreticalWeight: number;
  /**
   * Weight of one unit as the customer is billed for it, when the order is
   * struck on a trade basis. Omit it and the theoretical weight bills the line,
   * which is what happens on a product that declares no trade weight.
   *
   * 🔴 The two are not the same number and the difference is not rounding.
   * Product `PK304L300315` carries three densities side by side — theoretical
   * 7 850, trade 8 000, German 0 — and the order's weight type picks which one
   * multiplies the volume. Five plates weigh 529,875 kg and bill as 540,0.
   */
  tradeWeight?: number;
  /** The line's own length in mm, or the product's when the line has none. */
  lengthMm: number;
  /** Margin floor from the product group; 0 disables the too-low flag. */
  minProfitMargin: number;
  /**
   * The unit the prices are struck in — the line's `PriceU`. Steel is sold by
   * the tonne far more often than by the piece, and getting this wrong scales
   * the whole line by its own piece count. Omit it and the line is treated as
   * priced per piece, which is what it meant before prices carried a unit.
   */
  priceUnit?: string | null;
  /** Needed only for an area or volume price. */
  widthMm?: number | null;
  thicknessMm?: number | null;
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
  profitFsp: number;
  /** What the line is billed on — the trade weight when the order uses one. */
  weightKg: number;
  /** What the line is costed on. Equal to `weightKg` on a theoretical order. */
  theoreticalWeightKg: number;
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
  fspPrice = 0,
  theoreticalWeight,
  tradeWeight,
  lengthMm,
  minProfitMargin,
  priceUnit,
  widthMm,
  thicknessMm,
}: QuoteLineFinancialsInput): QuoteLineFinancials => {
  const theoreticalWeightKg = quantity * theoreticalWeight;
  // A product with no trade weight bills on the physics, which is what every
  // line did before this distinction was found.
  const weightKg =
    tradeWeight && tradeWeight > 0 ? quantity * tradeWeight : theoreticalWeightKg;

  // 🔴 Two weights, one price unit.
  //
  // All three prices — sale, purchase and replacement — are struck in the same
  // unit, because the line carries one `PriceU` for the material it is made of.
  // That has not changed: pricing the sale by weight and the cost by piece
  // would still make the margin meaningless.
  //
  // What changed is *which weight* each is charged against. Watched on order
  // 102191, 21-9-2026: five plates at € 2 500,00 / TN billed € 1 350,00 —
  // 540,0 kg, the **trade** weight, and the figure printed on the confirmation
  // the customer receives — while costing € 1 090,91, which is 529,88 kg at
  // € 2 058,8151, the **theoretical** weight. Profit € 259,09, margin 19,2 %,
  // and the order header prints both weights side by side to say so.
  //
  // Using one weight for both overstated the margin on every trade-weight
  // order, and trade weight is what a customer record defaults to.
  const measureFor = (kg: number) =>
    priceMeasureFor(priceUnit, {
      quantity,
      weightKg: kg,
      lengthMm,
      widthMm,
      thicknessMm,
    }) ?? quantity;

  const measure = measureFor(weightKg);
  const costMeasure = measureFor(theoreticalWeightKg);

  // Every figure below is money the line will be billed for, so each is
  // rounded to the cent here rather than left to a caller's toFixed — which
  // rounds the wrong way on an exact half-cent. Profit is then the difference
  // between two rounded amounts, which is what an invoice shows.
  const amount = roundToCents(netPrice * measure);
  const costPrice = purchasePrice > 0 ? purchasePrice : replacementPrice;
  const costAmount = roundToCents(costPrice * costMeasure);
  const replacementCost = roundToCents(replacementPrice * costMeasure);
  // A product with no settlement price in force has no FSP profit to report —
  // zero here means "no basis", which is exactly what the reference showed for
  // `PK304L300315`, whose FSP column read € 0,00 beside a live APP figure.
  const fspCost = roundToCents(fspPrice * costMeasure);
  const profit = roundToCents(amount - costAmount);
  const profitMargin = profitMarginPercent(amount, profit);

  return {
    amount,
    purchasePrice,
    costPrice,
    costAmount,
    replacementCost,
    profit,
    profitMargin,
    profitReplPrice: roundToCents(amount - replacementCost),
    profitFsp: fspPrice > 0 ? roundToCents(amount - fspCost) : 0,
    weightKg,
    theoreticalWeightKg,
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

// The tolerance the kilo balance is struck at. Weights are held to two
// decimals, so three rounded figures can miss zero by a cent of a kilo without
// anything being wrong. Anything larger is a real discrepancy.
const PRODUCTION_BALANCE_TOLERANCE_KG = 0.01;

export type ProductionRunLot = {
  /** Weight in kilograms. */
  kg: number;
  /** What a kilogram of it is carried at. */
  costPerKg: number;
};

export type ProductionRunBalanceInput = {
  /** Every lot taken to the machine, with what each is carried at. */
  fetched: ProductionRunLot[];
  /** Weight of the finished goods, across every line being reported. */
  componentKg: number;
  /** Usable offcut going back to the rack: the same material, so the same cost. */
  remnantKg: number;
  /** Swarf and drop. It leaves at no value, so its cost lands on the goods. */
  scrapKg: number;
};

export type ProductionRunBalance = {
  fetchedKg: number;
  /** fetched − components − remnant − scrap. */
  differenceKg: number;
  /** Whether the run may be reported at all. */
  balanced: boolean;
  fetchedCost: number;
  remnantCost: number;
  componentCost: number;
  componentCostPerKg: number;
};

/**
 * Strikes a production run's balance, in kilograms.
 *
 * Cutting steel destroys the lots it came from: what leaves the machine is
 * customer goods, usable offcut, and scrap. Pieces are no guide to whether that
 * adds up — two plates can legitimately become five pieces — so the books are
 * kept in weight, and the run only closes when
 *
 *   fetched = components + remnant + scrap
 *
 * A run that does not balance is not a run that lost a little material; it is a
 * run somebody has mistyped. Reporting it anyway would invent or destroy steel
 * that physically exists, so the caller refuses instead.
 *
 * The money follows the same split. The offcut is carried at what the input was
 * carried at, because it is the same material in a smaller size and anyone may
 * order it next. Scrap leaves at nothing. Everything remaining — the scrap's
 * cost included — lands on the finished goods. That is deliberate: yield loss
 * belongs to the output that caused it, so a wasteful cut shows up as thin
 * margin on the line that caused it rather than disappearing into the
 * valuation of what is left on the shelf.
 */
export const productionRunBalance = ({
  fetched,
  componentKg,
  remnantKg,
  scrapKg,
}: ProductionRunBalanceInput): ProductionRunBalance => {
  const fetchedKg = fetched.reduce((total, lot) => total + lot.kg, 0);
  const fetchedCost = fetched.reduce(
    (total, lot) => total + lot.kg * lot.costPerKg,
    0,
  );

  const differenceKg = fetchedKg - componentKg - remnantKg - scrapKg;

  // Averaged over everything fetched, because a cut mixes the lots it was fed:
  // once two coils are on the same bed there is no telling which one a given
  // offcut came off.
  const costPerKg = fetchedKg > 0 ? fetchedCost / fetchedKg : 0;
  const remnantCost = remnantKg * costPerKg;
  const componentCost = fetchedCost - remnantCost;

  return {
    fetchedKg,
    differenceKg,
    balanced: Math.abs(differenceKg) <= PRODUCTION_BALANCE_TOLERANCE_KG,
    fetchedCost,
    remnantCost,
    componentCost,
    componentCostPerKg: componentKg > 0 ? componentCost / componentKg : 0,
  };
};

export type QuoteLinePreviewInput = {
  quantity: number;
  lengthMm: number | null;
  basePrice: number;
  replacementPrice: number;
  purchasePrice: number;
  /**
   * The weight of one piece — already resolved, not the raw catalogue column,
   * which holds a density when the product's weight unit says M3.
   */
  theoreticalWeight: number;
  productLengthMm: number;
  minProfitMargin: number;
  /**
   * The unit the product's prices are struck in. The preview has to agree with
   * the server on this or the grid totals a tonne-priced line by its piece
   * count and the saved line comes back a thousandfold different.
   */
  priceUnit?: string | null;
  widthMm?: number | null;
  thicknessMm?: number | null;
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
  priceUnit,
  widthMm,
  thicknessMm,
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
      priceUnit,
      widthMm,
      thicknessMm,
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
 * has no options block of its own.
 *
 * ⚠️ It used to be narrower still. Order 102191, watched being made on
 * 21-9-2026, prints `Transport costs` and `Handling costs` on its summary just
 * as a quote does — so the claim that an order has none was wrong, and a quote
 * converted to an order was quietly dropping both.
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
  | "transportCosts"
  | "handlingCosts"
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
    vatAmount: moneyString(
      Number(invoice.invoiceAmountInclVat ?? 0) -
        Number(invoice.invoiceAmountExclVat ?? 0),
    ),
    // An invoice stores neither, and whether the reference's does is unknown:
    // no invoice has been watched being raised. Left null rather than carried
    // over from the order, since a guess here would show a cost the document
    // may never have had. H3 settles it.
    transportCosts: null,
    handlingCosts: null,
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

/**
 * Each usage category paired with the `Texts` column that records it.
 *
 * The order is the reference system's column order on its Texts overview, not
 * an alphabetical or grouped one. It is the single list: the overview columns,
 * the export, the detail page and the edit dialog all read it, so the ticks
 * cannot drift out of step with each other.
 */
export const TEXT_USAGE_CATEGORY_FIELDS: Array<{
  key: TextUsageCategory;
  field: TextUsageCategoryField;
}> = [
  { key: "visit_report", field: "visitReport" },
  { key: "purchase_quote_request", field: "purchaseQuoteRequest" },
  { key: "purchase_order", field: "purchaseOrder" },
  { key: "purchase_order_tool_tip", field: "purchaseOrderToolTip" },
  { key: "purchase_return_order", field: "purchaseReturnOrder" },
  { key: "customer_label", field: "customerLabel" },
  { key: "loadlist", field: "loadlist" },
  { key: "warehouse_order", field: "warehouseOrder" },
  { key: "sales_quote", field: "salesQuote" },
  { key: "sales_order", field: "salesOrder" },
  { key: "sales_order_tool_tip", field: "salesOrderToolTip" },
  { key: "production_order", field: "productionOrder" },
  { key: "ride_list", field: "rideList" },
  { key: "transport_planning", field: "transportPlanning" },
  { key: "sales_invoice", field: "salesInvoice" },
  { key: "waybill", field: "waybill" },
  { key: "website_after", field: "websiteAfter" },
  { key: "website_in_advance", field: "websiteInAdvance" },
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
): boolean => status !== "awarded" && status !== "lost" && status !== "expired";

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
  status: PurchaseOrderStatus | null,
): boolean =>
  status !== "delivered" && status !== "invoiced" && status !== "cancelled";

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
  approved: "done",
  done: "done",
  delivered: "done",
  invoiced: "done",
  received: "done",
  credited: "done",
  awarded: "done",
  ok: "done",
  // A purchase line starts provisional and is checked against the supplier's
  // confirmation before anything arrives — neither is finished, neither is
  // wrong.
  provisional: "neutral",
  checked: "active",
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

// ---------------------------------------------------------------------------
// Purchase and stock arithmetic
//
// Every rule below was proved against real rows exported from the reference
// system, not inferred — the working is in docs/reference-system/. They live
// here so the same figure cannot be derived two different ways on two screens.
// ---------------------------------------------------------------------------

/**
 * The theoretical weight of one piece, from its dimensions and the material's
 * density. This is the figure behind every kilo column in the system: a
 * purchase line's `Kg(pur)`, a receival's `Kg(p)`, an invoice line's `Kg` and a
 * lot's `Stock (Kg)` are all this number times a quantity.
 *
 * Density is the product's own figure in kg/m³ (7 850 for stainless), not a
 * grade default — the reference stores it per product, and a 300-series
 * default of 7 900 is 0,6 % out on every weight.
 *
 * Returns null when the product is not dimensioned. A piece article carries no
 * length, width or thickness at all and stores its weight per piece directly,
 * so there is nothing to derive.
 */
export const pieceWeightKg = (
  lengthMm: number | null | undefined,
  widthMm: number | null | undefined,
  thicknessMm: number | null | undefined,
  densityKgPerM3: number | null | undefined,
): number | null => {
  if (!lengthMm || !widthMm || !thicknessMm || !densityKgPerM3) {
    return null;
  }
  return (
    (lengthMm / 1000) * (widthMm / 1000) * (thicknessMm / 1000) * densityKgPerM3
  );
};

/**
 * What a weight costs at a price quoted in that price's own unit.
 *
 * A purchase price always carries the unit it is struck in — `PriceU` on a
 * line, `Per` on an option, "€ 1.950,00 per TN" on the order. A tonne price
 * divides the weight by a thousand; a kilo price does not.
 *
 * Anything else falls back to the tonne, which is what all but a handful of
 * lines use, rather than returning nothing and losing the amount entirely.
 */
export const amountForWeight = (
  pricePerUnit: number,
  priceUnit: string | null | undefined,
  weightKg: number,
  line?: Omit<PriceMeasureLine, "weightKg">,
): number => {
  // Given the rest of the line, every unit can be read — the piece, the metre,
  // the square metre — and not only the three that are weights. A line priced
  // `ST` valued off its weight is out by whatever the piece happens to weigh.
  //
  // A caller that knows the quantity but not the dimensions still fixes `ST`;
  // an area or volume price falls through to the weight reading below, which is
  // what it did before.
  if (line) {
    const measure = priceMeasureFor(priceUnit, { ...line, weightKg });
    if (measure !== null) {
      return roundToCents(pricePerUnit * measure);
    }
  }

  // Without a line there is only the weight to go on, so the weight units are
  // all this can read. Anything else falls back to the tonne, which is what all
  // but a handful of purchase lines are struck in.
  return roundToCents(
    (priceUnit ?? "").trim().toUpperCase() === "KG"
      ? pricePerUnit * weightKg
      : pricePerUnit * (weightKg / 1000),
  );
};

/**
 * What a lot of stock is worth. The valuation price is per tonne, like every
 * other price in the system.
 *
 * A negative valuation price is a data error rather than a business case, but
 * it exists in the reference's own data, so this multiplies it out rather than
 * clamping and hiding it.
 */
export const stockValueFromWeight = (
  weightKg: number,
  valuationPricePerTonne: number,
): number => weightKg * (valuationPricePerTonne / 1000);

/**
 * Which of a purchase line's two weights the supplier is actually paid on.
 *
 * 🔴 The weighed one, whenever there is one. Proved to the cent on purchase
 * order `402532` — see the comment on `PurchaseOrderItems.kgActual` for the
 * arithmetic and the whole-document check.
 *
 * Before any goods arrive there is nothing on the scale, so the theoretical
 * weight stands in: an order has to show a value the moment it is placed, and
 * that value is the best estimate until the lorry comes. Once a receival
 * reports a weight, that weight is the truth and the amount is recomputed
 * against it.
 *
 * Zero is treated as "not weighed yet" rather than "weighs nothing", because a
 * line that has genuinely received nothing must keep showing what it is
 * expected to cost. A line that really did arrive empty has no receival to roll
 * up from either, so the two cases do not collide.
 */
/** A lot's correctable attributes, as the correction dialog reads them. */
export type StockCorrectableValues = Record<
  StockCorrectableAttribute,
  string | number | null | undefined
>;

/** One attribute that changed, and what it changed from and to. */
export type StockAttributeChange = {
  attribute: StockCorrectableAttribute;
  before: string;
  after: string;
};

/**
 * One attribute value as it is compared and stored.
 *
 * Numbers arrive from the database as strings and from a form as strings too,
 * but `4` and `4.00` are the same thickness, so a numeric value is compared as
 * a number and an empty one as the empty string. Nothing is stored as null:
 * "was blank, now says something" is a change worth reading back.
 */
const normaliseAttributeValue = (
  value: string | number | null | undefined,
): string => {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value).trim();
  if (text === "") {
    return "";
  }
  const asNumber = Number(text);
  return Number.isFinite(asNumber) && /^-?\d*[.,]?\d+$/.test(text)
    ? String(asNumber)
    : text;
};

/**
 * What each of the eight correction reasons decides.
 *
 * Two things, and both of them matter:
 *
 * `movementReason` — the coarse reason the resulting row is filed under, so
 * the movement ledger stays readable with 22 reasons instead of 30. `Rejected
 * material` and `Inventory rejection` are both write-offs of metal that failed
 * inspection; `Stock difference` and `Stock correction` are both somebody
 * squaring the books. The correction reason itself is kept on the row beside
 * it, so nothing is lost by the grouping.
 *
 * `movesMetal` — whether the reason may touch quantity at all. Only the remark
 * reason may not: it is annotation, and a remark edit that wrote a stock
 * movement would put a phantom row in a ledger finance reconciles against.
 */
export const stockCorrectionReasonRules: Record<
  StockCorrectionReason,
  { movementReason: StockMovementReason; movesMetal: boolean }
> = {
  rejected_material: { movementReason: "damaged", movesMetal: true },
  inventory_rejection: { movementReason: "damaged", movesMetal: true },
  stock_difference: { movementReason: "count_correction", movesMetal: true },
  stock_correction: { movementReason: "manual_correction", movesMetal: true },
  transfer_length: { movementReason: "manual_correction", movesMetal: true },
  internal_damage: { movementReason: "damaged", movesMetal: true },
  scrap: { movementReason: "warehouse_scrapped", movesMetal: true },
  stock_remark: { movementReason: "manual_correction", movesMetal: false },
};

/**
 * Which of a lot's attributes a correction changed, as the pairs worth
 * recording.
 *
 * 🔴 This is the whole of item 26b. The reference changed lot `404763` from
 * `Standaard` to `2nd choice` and wrote nothing down — so its movement ledger
 * can tell you how much of a lot there has ever been, and nothing at all about
 * what it was. Ours writes a row per changed attribute, which is why this
 * returns a list rather than a flag.
 *
 * Only genuine changes come back. Re-saving the dialog with nothing touched is
 * a no-op here, the way it was in the reference — the difference is that ours
 * says so rather than silently succeeding.
 */
export const stockAttributeChanges = (
  before: StockCorrectableValues,
  after: Partial<StockCorrectableValues>,
): StockAttributeChange[] =>
  stockCorrectableAttributes.flatMap((attribute) => {
    // 🔴 A key the dialog never offered is not a cleared field.
    //
    // The reference's two halves are independently tickable, so a correction
    // that only touches the quantity half submits nothing at all about the
    // remark. Reading an absent key as the empty string recorded every such
    // correction as having wiped the remark — a change that never happened, in
    // the one ledger that exists to be trusted about what changed.
    if (!(attribute in after)) {
      return [];
    }
    const from = normaliseAttributeValue(before[attribute]);
    const to = normaliseAttributeValue(after[attribute]);
    if (from === to) {
      return [];
    }
    return [{ attribute, before: from, after: to }];
  });

export const billingWeightKg = (
  kgTheoretical: string | number | null | undefined,
  kgActual: string | number | null | undefined,
): number => {
  const actual = Number(kgActual ?? 0);
  if (Number.isFinite(actual) && actual > 0) {
    return actual;
  }
  const theoretical = Number(kgTheoretical ?? 0);
  return Number.isFinite(theoretical) ? theoretical : 0;
};

// "Available" means two different things and both are computed in SQL, in the
// query that needs them, rather than here:
//
//   a purchase line   still inbound and unpromised — qty(p) − qty(a) − reserved
//   a warehouse lot   free on the shelf — quantity − reserved
//
// They are not interchangeable, and conflating them double-counts. Kept as a
// note rather than as helpers nothing calls, so there is one definition of
// each rather than two that can drift.

/**
 * What a product's stored "Theor. Weight" figure has to be multiplied by to
 * become the weight of one piece, given the "Theor. Weight U." beside it.
 *
 * This is the whole reason the unit column exists, and reading the figure
 * without it is how a density gets mistaken for a weight. The reference's own
 * Nesting screen shows a cold-rolled 304L plate with a "Theor. Weight" of
 * 7.850 and a "Theor. Weight U." of `M3` — that is 7 850 kg per cubic metre,
 * the density of stainless steel, not a 7,85-tonne plate.
 *
 * `null` means the unit gives no way to reach a piece weight from dimensions
 * the product may not have, so the caller should fall back rather than invent
 * a number.
 */
export const THEORETICAL_WEIGHT_BASIS: Partial<
  Record<SalesUnit, "per_piece" | "per_metre" | "per_square_metre" | "density">
> = {
  KG: "per_piece",
  ST: "per_piece",
  M1: "per_metre",
  M2: "per_square_metre",
  M3: "density",
};

/**
 * The weight of one piece, worked out from the product's stored theoretical
 * weight and the unit that says how to read it.
 *
 * Each basis needs a different slice of the article's dimensions, and any one
 * of them being missing means the figure cannot be reached — so this returns
 * null rather than silently treating an absent width as zero and reporting a
 * weightless plate.
 */
export const theoreticalPieceWeightKg = (product: {
  theoreticalWeight?: string | number | null;
  weightUnit?: SalesUnit | null;
  lengthMm?: number | null;
  widthMm?: number | null;
  thicknessMm?: string | number | null;
  theoreticalThicknessMm?: string | number | null;
}): number | null => {
  const stored = Number(product.theoreticalWeight ?? 0);
  if (!(stored > 0)) {
    return null;
  }

  const basis = product.weightUnit
    ? THEORETICAL_WEIGHT_BASIS[product.weightUnit]
    : undefined;
  const metres = (product.lengthMm ?? 0) / 1000;
  const width = (product.widthMm ?? 0) / 1000;
  // The metal's real thickness, not the size it is sold as. Steel is rolled a
  // little over or under nominal, the reference records both, and it is the
  // rolled figure the weight comes from: with it, density x volume reproduces
  // all 1.932 dimensioned lots in the reference's own export; with the nominal
  // one, 110 of them are out by up to a few per cent.
  const rolled = Number(product.theoreticalThicknessMm ?? 0);
  const thickness =
    (rolled > 0 ? rolled : Number(product.thicknessMm ?? 0)) / 1000;

  switch (basis) {
    case "per_piece":
      return stored;
    case "per_metre":
      return metres > 0 ? stored * metres : null;
    case "per_square_metre":
      return metres > 0 && width > 0 ? stored * metres * width : null;
    case "density":
      return metres > 0 && width > 0 && thickness > 0
        ? stored * metres * width * thickness
        : null;
    default:
      // No unit recorded. Every other basis needs one to be read at all, so
      // the only safe reading left is the one the figure's own name suggests.
      return stored;
  }
};

/**
 * The weight of one unit of a product, in kilograms.
 *
 * Prefers `weightTheoretical`, which the product form already derives from the
 * article's dimensions and its grade's density and stores on save — that column
 * is a finished per-piece weight and needs no unit to interpret.
 *
 * Falls back to `theoreticalWeight`, which does, and hands it to
 * theoreticalPieceWeightKg with the dimensions the caller passed. That is where
 * the reference keeps 7 850 kg/m3 for a stainless plate, so reading it as a
 * per-piece figure would overstate the plate by five orders of magnitude.
 *
 * Returns null when neither is known, so a caller can tell "weighs nothing"
 * from "nobody has said".
 *
 * The density behind the stored figure comes from the product's own
 * `densityKgDm3` when it has one, and from the grade table otherwise — the
 * reference keeps a density per product, and for a 316L plate its 7,850
 * differs from our grade table's 8,000 by 1,9 %.
 */
export const productPieceWeightKg = (product: {
  weightTheoretical?: string | number | null;
  theoreticalWeight?: string | number | null;
  weightUnit?: SalesUnit | null;
  lengthMm?: number | null;
  widthMm?: number | null;
  thicknessMm?: string | number | null;
}): number | null => {
  // `weightTheoretical` is already the weight of one piece: the product form
  // derives it from the article's dimensions and its grade's density and
  // writes it on save, so there is nothing left to multiply out here.
  const perPiece = Number(product.weightTheoretical ?? 0);
  if (perPiece > 0) {
    return perPiece;
  }
  return theoreticalPieceWeightKg(product);
};

/**
 * The weight of one unit on the basis a document is struck on.
 *
 * 🔴 A product carries three, and they are different numbers. The reference's
 * `PK304L300315` prints them together:
 *
 *     Theoretically  7.850,000
 *     Trade          8.000,000
 *     German             0,000
 *
 * — densities, beside `Weight: 7.850,000 KG/M3` which is the first of them
 * again. The order's weight type picks which one multiplies the volume, and
 * nothing else about the line changes. Five 3000×1500×3 plates come to 529,875
 * kg theoretical and 540,0 kg trade, a ratio of 8 000 ÷ 7 850 = 1,0191.
 *
 * Returns null when the basis has no figure — `German` is 0,000 on that product,
 * which means "not offered" rather than "weighs nothing" — so the caller falls
 * back to the theoretical weight rather than billing the customer for zero.
 *
 * `weighed` has no answer here by definition: it is whatever the scale said, and
 * that lives on the line.
 */
export const pieceWeightForBasis = (
  product: {
    weightTheoretical?: string | number | null;
    weightTrade?: string | number | null;
    weightGerman?: string | number | null;
    theoreticalWeight?: string | number | null;
    weightUnit?: SalesUnit | null;
    lengthMm?: number | null;
    widthMm?: number | null;
    thicknessMm?: string | number | null;
  },
  basis: OrderWeightType | null | undefined,
): number | null => {
  const stored =
    basis === "trade_weight"
      ? Number(product.weightTrade ?? 0)
      : basis === "german_trade_weight"
        ? Number(product.weightGerman ?? 0)
        : 0;
  return stored > 0 ? stored : null;
};

/**
 * How much of a line a price is charged against, in the unit that price is
 * struck in.
 *
 * Every price in the system carries its unit beside it — `PriceU` on a line,
 * `Per` on an option, "€ 1.950,00 per TN" on a purchase order — and the unit is
 * not decoration. A tonne price multiplied by a piece count is wrong by roughly
 * the piece count, which is how a €666 delivery becomes a €21 230 one.
 *
 * Proved to the cent on the reference's own Blocked deliveries screen, where
 * twenty-odd lines at four different tonne prices all satisfy
 * `amount = price × Kg(p) ÷ 1000`: 3 893,6 kg at €2 550/TN bills €9 928,68 and
 * 5 184 kg at €3 300/TN bills €17 107,20.
 *
 * The three "per hundred" units are the reason this is a lookup and not two
 * branches. Returns null for a basis that cannot be worked out from what the
 * line knows — an area price on a line with no width — so a caller can fall
 * back rather than invent a number.
 */
export type PriceMeasureLine = {
  quantity: number;
  weightKg: number;
  lengthMm?: number | null;
  widthMm?: number | null;
  thicknessMm?: number | null;
};

export const priceMeasureFor = (
  priceUnit: string | null | undefined,
  line: PriceMeasureLine,
): number | null => {
  const metres = (line.lengthMm ?? 0) / 1000;
  const width = (line.widthMm ?? 0) / 1000;
  const thickness = (line.thicknessMm ?? 0) / 1000;
  switch ((priceUnit ?? "").trim().toUpperCase()) {
    // The three weight bases return null on a weightless line rather than
    // zero, for the same reason an area price returns null without a width: a
    // measure nobody can work out is not a measure of nothing. Returning zero
    // would bill the line at nothing at all, silently. 114 products in the
    // catalogue are sold by the tonne and carry no weight, so this is the
    // ordinary case rather than a defensive flourish.
    case "KG":
      return line.weightKg > 0 ? line.weightKg : null;
    case "TN":
      return line.weightKg > 0 ? line.weightKg / 1000 : null;
    // A hundred kilograms — the metric quintal, still quoted on thin coil.
    case "HK":
      return line.weightKg > 0 ? line.weightKg / 100 : null;
    case "M1":
      return metres > 0 ? metres * line.quantity : null;
    case "HM":
      return metres > 0 ? (metres * line.quantity) / 100 : null;
    case "M2":
      return metres > 0 && width > 0 ? metres * width * line.quantity : null;
    case "M3":
      return metres > 0 && width > 0 && thickness > 0
        ? metres * width * thickness * line.quantity
        : null;
    case "MM":
      return (line.lengthMm ?? 0) > 0
        ? (line.lengthMm ?? 0) * line.quantity
        : null;
    case "ST":
      return line.quantity;
    case "HS":
      return line.quantity / 100;
    default:
      return null;
  }
};

/**
 * How much of a line an option is charged against.
 *
 * An option's basis comes from the `Per` column on the option row rather than
 * the line's own `PriceU`, so two options on one line can be charged two
 * different ways — surface treatments by area, decoiling by weight, sawing by
 * piece. Which basis to use is the only thing that differs; how to measure it
 * is the same question, so this defers to priceMeasureFor.
 */
export const optionMeasureFor = (
  priceUnit: string | null | undefined,
  line: {
    quantity: number;
    weightKg: number;
    lengthMm?: number | null;
    widthMm?: number | null;
  },
): number | null => priceMeasureFor(priceUnit, line);

/**
 * What an option costs on a line: its price times the measure that price is
 * struck against.
 *
 * Proved to the cent against the reference's own order 400904 — Blue Foil at
 * €1,40 per m² on 28 sheets of 2200 × 1000 comes to €86,24, and Decoilen at
 * €110 per tonne on the same line comes to €66,49.
 *
 * When the basis is unknown the measure falls back to the piece count, which
 * is the reading the system had before options carried a basis at all.
 */
export const optionAmount = (
  price: number,
  priceUnit: string | null | undefined,
  line: {
    quantity: number;
    weightKg: number;
    lengthMm?: number | null;
    widthMm?: number | null;
  },
): number => price * (optionMeasureFor(priceUnit, line) ?? line.quantity);

/**
 * A purchase line's net price: the gross price less the group discount and
 * then the line discount, both percentages.
 *
 * The discounts **cascade** — the second comes off what the first left, not off
 * the gross. Proved on purchase quote 900003, typed into the reference on
 * 10-9-2026 for exactly this question, because every row captured before it
 * carried 0 % in both boxes and 0 % cannot tell the two readings apart:
 *
 *   gross 1.000,00  line 5 %  group  —     Net Price   950,00
 *   gross 1.000,00  line 5 %  group 3 %     Net Price   921,50
 *
 * The first line is the same quote caught mid-edit, before the group discount
 * was committed, so both readings come from one line seconds apart. 950 x 0,97
 * is 921,50; additive would have printed 920,00. Multiplication is commutative,
 * so which discount is applied first does not matter and the argument order
 * here is free.
 *
 * The same screenshot settles a second thing in passing: `Amount` is the net
 * price times the weight in the price's own unit, not times the piece count.
 * 921,50 per tonne on 70,7 kg prints EUR 65,15, and at 950 it printed 67,17.
 */
export const netPriceAfterDiscounts = (
  grossPrice: number,
  groupDiscountPercent: number,
  lineDiscountPercent: number,
): number =>
  grossPrice *
  (1 - (groupDiscountPercent || 0) / 100) *
  (1 - (lineDiscountPercent || 0) / 100);

/**
 * How far a warehouse or production work order has missed its planned weight,
 * as a percentage of what was planned.
 *
 * This is the reference's "Weight deviation" column, and it is **not** the same
 * figure as `Kg(dif)` on the Warehouse workorders screen. Both compare planned
 * against actual and they point opposite ways:
 *
 *   Kg(dif)           Kg(a) - Kg(p), in kilograms, signed
 *   Weight deviation  |Kg(p) - Kg(a)| / Kg(p) x 100, a magnitude
 *
 * The numerator is an absolute value and the denominator is not. That is not a
 * guess: it is the only reading that fits all 13.583 lines of the reference's
 * own 13.610-line export, including the single line planned at -125 kg, which
 * prints -176 rather than 176 because the sign of Kg(p) survives.
 *
 * So the column answers "by how much did this miss", not "which way". 337 lines
 * came in heavier than planned and the reference prints every one of them
 * positive. An earlier version of this helper returned them negative.
 *
 * Zero planned reads 0, not blank - all 27 such lines in the export do, one of
 * them having taken 46 kg against nothing planned. Arguably that should be
 * unanswerable rather than on-target, but the screen is what we are matching.
 */
export const weightDeviationPercent = (
  kgPlanned: number,
  kgActual: number,
): number =>
  kgPlanned === 0 ? 0 : (Math.abs(kgPlanned - kgActual) / kgPlanned) * 100;

/**
 * What is still to be called off on a line the customer releases in batches.
 *
 * Proved to the kilogram on the reference's Blocked deliveries screen, where a
 * line planned at 5 184 kg with 3 024 kg already delivered shows exactly
 * 2 160 kg of call-off left, and every untouched line shows its full planned
 * figure. The same subtraction gives `Qty(call-off)` from the quantities.
 *
 * Floored at zero: over-delivering is a real thing that happens, and it means
 * nothing is left to call off, not that the customer owes us goods back.
 */
export const callOffRemaining = (planned: number, actual: number): number =>
  Math.max(0, planned - actual);

/**
 * How much of a day's booked warehouse capacity is still to be worked.
 *
 * The reference's Warehouse capacity screen counts work orders, not hours, and
 * its three columns are not three independent totals - `Remaining` is what is
 * left of `Occupied` once `Ready` is taken off. A section showing 4 occupied,
 * 1 ready and 3 remaining has four work orders booked, of which one is done.
 *
 * Which means the capacity booked for the day is `occupied` on its own. Adding
 * the three together counts the same work orders twice over.
 *
 * Confirmed a second time on 10-9-2026, from a different screen: all 403 rows
 * of the Production capacity export satisfy it, across both its squared and its
 * un-squared column families.
 *
 * ⚠️ **It is not clamped at zero, and it used to be.** One of those 403 rows —
 * `Knip` / ShearCut — reads 2.180 occupied against 2.296 ready and the
 * reference prints `Remaining -116`. More work was reported ready than was ever
 * booked, and that is worth seeing. Clamping turned it into a tidy zero and
 * threw away the only signal that the day's numbers do not add up.
 *
 * This is the opposite decision to [callOffRemaining], deliberately: there,
 * over-delivery means nothing is left to call off, and a negative would read as
 * the customer owing us goods back. Here a negative has a plain meaning.
 */
export const capacityRemaining = (occupied: number, ready: number): number =>
  occupied - ready;

/**
 * The seven states a trip passes through, and what each one means for the
 * goods. Read off the reference's "Transport status adjustments" screen, which
 * is an audit log of this column: one row per change, with the modifier, the
 * timestamp, the bill of lading and the order line it applied to.
 *
 * The distinction that matters is `isLoaded`. Up to `loading_list` the goods
 * are still on the shelf and the trip can be re-planned freely. From `loaded`
 * they are on the vehicle, so cancelling means unloading it again.
 */
export const TRIP_STATUS_META: Record<TripStatus, TripStatusMeta> = {
  new: { step: 0, isLoaded: false, leftTheYard: false },
  scheduled: { step: 1, isLoaded: false, leftTheYard: false },
  loading_list: { step: 2, isLoaded: false, leftTheYard: false },
  loaded: { step: 3, isLoaded: true, leftTheYard: false },
  loading_done: { step: 4, isLoaded: true, leftTheYard: false },
  in_transit: { step: 5, isLoaded: true, leftTheYard: true },
  completed: { step: 6, isLoaded: true, leftTheYard: true },
};

export const tripStatusMetaOf = (status: TripStatus): TripStatusMeta =>
  TRIP_STATUS_META[status];

/** The next state up the ladder, or null when the trip is finished. */
export const nextTripStatus = (status: TripStatus): TripStatus | null =>
  tripStatuses[TRIP_STATUS_META[status].step + 1] ?? null;

/**
 * Whether a trip may be moved from one status to another.
 *
 * Forwards one step at a time, and backwards only while the goods are still on
 * the shelf. Once a trip is loaded, undoing the paperwork without unloading the
 * lorry would leave stock the system thinks is in two places.
 */
export const canMoveTripTo = (from: TripStatus, to: TripStatus): boolean => {
  const a = TRIP_STATUS_META[from];
  const b = TRIP_STATUS_META[to];
  if (b.step === a.step + 1) {
    return true;
  }
  return b.step < a.step && !a.isLoaded;
};

/**
 * The six states a reception passes through, and the two questions each one
 * answers: does a work order exist yet, and are the goods actually here.
 *
 * These are the reference's own values, read off a 151-row export of its
 * Purchase receivals screen. `workorders_created` is the state that explains
 * why our own build received goods three steps too late: the reception is not
 * the receipt. Raising the reception only promises the goods; approving the
 * Unloading warehouse work order it spawns is what puts them on a shelf.
 */
export const RECEIPT_STATUS_META: Record<ReceiptStatus, ReceiptStatusMeta> = {
  new: { step: 0, workOrderRaised: false, goodsAreIn: false },
  released: { step: 1, workOrderRaised: false, goodsAreIn: false },
  workorders_created: { step: 2, workOrderRaised: true, goodsAreIn: false },
  partially_received: { step: 3, workOrderRaised: true, goodsAreIn: true },
  received: { step: 4, workOrderRaised: true, goodsAreIn: true },
  invoiced: { step: 5, workOrderRaised: true, goodsAreIn: true },
  // Terminal, and not the top of the ladder — a lapsed reception never got its
  // goods, so it shares a step with the state it lapsed out of rather than
  // claiming to be further along than "received".
  expired: { step: 5, workOrderRaised: false, goodsAreIn: false },
};

export const receiptStatusMetaOf = (status: ReceiptStatus): ReceiptStatusMeta =>
  RECEIPT_STATUS_META[status];

/**
 * What may be done to the selected reception on a purchase order, and why not
 * when the answer is no.
 *
 * 🔑 **Read off the reference on 6-10-2026 by driving it**, rather than guessed.
 * Order `404150/10` holds two receptions, one `Received` and one `Released`; the
 * toolbar was photographed with each selected in turn:
 *
 * | Button | `Received` selected | `Released` selected |
 * |---|---|---|
 * | `New` | grey | grey |
 * | `Delete` | grey | ✅ enabled |
 * | `Split` | grey | grey |
 * | `Batch registration` | ✅ enabled | grey |
 * | `Charge aanpassen…` | ✅ enabled | grey |
 *
 * The prediction had been the opposite way round, and it was wrong. The rule
 * the capture actually states is a single question — **are the goods here?** —
 * which is precisely `RECEIPT_STATUS_META[...].goodsAreIn`, so this reads that
 * rather than listing statuses a second time:
 *
 * - **Goods in.** You have the metal in front of you and the mill certificate
 *   in your hand, so you may stamp its identity (`Charge aanpassen`) and settle
 *   whether a document is required before it may be used
 *   (`Partijregistratie instellingen`). You may **not** delete it — something
 *   physical happened, and a reception is the only record that it did.
 * - **Goods not in.** Nothing has happened, so the reception may be deleted
 *   outright. It may **not** carry a charge, because there is no metal to
 *   stamp one on.
 *
 * ⚠️ `canSplit` is always false, and that is a finding rather than a stub.
 * `Split` was greyed on **both** rows while four other buttons flipped, so it
 * is not gated on the reception at all — it must be gated on the **order**, and
 * that order was `Partially received`. H13 in `WHAT-IS-LEFT.md` holds the one
 * remaining case to try: an order with nothing received anywhere. Until that is
 * answered, refusing the split is the honest behaviour, and `splitReason` says
 * so rather than leaving a dead grey button on the screen.
 */
export const receptionActions = (
  status: ReceiptStatus | null,
): ReceptionActions => {
  // A reception whose status never imported is treated as not-yet-arrived: it
  // is the state that permits deletion and forbids stamping, which is the safe
  // way round for a row nobody can vouch for.
  const goodsAreIn = status ? RECEIPT_STATUS_META[status].goodsAreIn : false;

  return {
    canDelete: !goodsAreIn,
    deleteReason: goodsAreIn
      ? "The goods have arrived. A reception that received metal is the only record that it did, so it cannot be deleted."
      : null,
    canRegisterBatch: goodsAreIn,
    canAdjustCharge: goodsAreIn,
    stampReason: goodsAreIn
      ? null
      : "Nothing has arrived yet, so there is no metal to stamp a charge on.",
    canSplit: false,
    splitReason:
      "Splitting a reception is not reachable from the order. The reference greys it whatever the reception's status, so the gate is on the order — see H13.",
  };
};

/**
 * A purchase order header's status, read off its lines.
 *
 * The header reads its **least-advanced live line**. Proved on two orders,
 * 7-10-2026: `404102` (lines Expired ×4, Received ×18, Invoiced ×8,
 * Released ×4) says `Released`; `402401` (Invoiced ×6, In progress ×1) says
 * `In progress`.
 *
 * - Lapsed and cancelled lines do not hold the header back. If nothing else
 *   is left, an all-lapsed order is `expired`.
 * - A provisional line on a final order is a draft line being typed; it does
 *   not drag the order back to provisional.
 * - A provisional or cancelled header is frozen — making it final, or calling
 *   it off, is an act, not a consequence of its lines.
 * - The two imported sales words a purchase line can still carry,
 *   `partially_delivered` and `completed`, read as their purchase twins.
 */
export const purchaseOrderStatusFromLines = (
  current: PurchaseOrderStatus,
  lineStatuses: readonly (OrderLineStatus | null)[],
): PurchaseOrderStatus => {
  if (current === "provisional" || current === "cancelled") {
    return current;
  }
  const step: Partial<Record<OrderLineStatus, number>> = {
    released: 1,
    checked: 2,
    in_progress: 3,
    partially_received: 4,
    partially_delivered: 4,
    received: 5,
    partially_invoiced: 5,
    invoiced: 6,
    completed: 6,
  };
  const ladder: readonly PurchaseOrderStatus[] = [
    "released",
    "released",
    "checked",
    "in_progress",
    "partially_received",
    "received",
    "invoiced",
  ];
  const live = lineStatuses
    .map((status) => (status ? step[status] : undefined))
    .filter((value): value is number => value !== undefined);
  if (live.length === 0) {
    const lapsed = lineStatuses.some((status) => status === "expired");
    return lapsed ? "expired" : current;
  }
  return ladder[Math.min(...live)] ?? current;
};

/**
 * What a buyer may do to the selected purchase line.
 *
 * `Close line` is for a line that arrived short and whose remainder is not
 * coming — the reference closes those (`401616/50` at 6 of 17, J4 7-10-2026).
 * It is only offered on a line still `Partially received`: one inside the
 * unloading tolerance has already closed itself, one with nothing received is
 * undelivered rather than short, and a line already closed stays closed. The
 * server action re-checks every one of these.
 */
export const purchaseLineActions = (
  line: PurchaseLineActionInput | null,
): PurchaseLineActions => {
  if (!line) {
    return { canClose: false, closeReason: "Select a line to act on it." };
  }
  if (line.closedAt !== null) {
    return {
      canClose: false,
      closeReason: "This line was closed short by hand.",
    };
  }
  const received = Number(line.qtyReceived ?? 0);
  if (received <= 0) {
    return {
      canClose: false,
      closeReason:
        "Nothing has arrived on this line, so it cannot be closed short.",
    };
  }
  if (line.lineStatus !== "partially_received") {
    return {
      canClose: false,
      closeReason:
        "Only a line still waiting for part of its goods can be closed short.",
    };
  }
  return {
    canClose: true,
    closeReason: `${received} of ${Number(line.orderedQuantity)} arrived and the rest is outside the unloading tolerance. Close the line if the remainder is not coming.`,
  };
};

/**
 * Where a reception stands once an Unloading work order against it has been
 * approved.
 *
 * Approving the work order is the moment the goods exist, so this is the single
 * transition the whole receipt chain turns on. Whether it lands on `received`
 * or `partially_received` depends on whether the weight reported on the floor
 * covers what the reception was expecting - the reference keeps both values and
 * its Receipts screen filters on exactly that pair.
 *
 * A reception already invoiced is left where it is: the money has moved, and a
 * late work order does not un-bill it.
 */
export const receiptStatusAfterUnloading = ({
  status,
  kgExpected,
  kgReceived,
}: {
  status: ReceiptStatus;
  kgExpected: number;
  kgReceived: number;
}): ReceiptStatus => {
  // Both terminal states are left alone: an invoiced reception has had its
  // money move, and an expired one is closed. A late work order against either
  // is a data problem, not a receipt.
  if (status === "invoiced" || status === "expired" || kgReceived <= 0) {
    return status;
  }
  // Weights are reported off a weighbridge, so an exact match is luck rather
  // than the rule. Anything within the quantity epsilon counts as complete.
  return kgReceived + QUANTITY_EPSILON >= kgExpected
    ? "received"
    : "partially_received";
};

/**
 * What a receipt is still owed an invoice for, in euros.
 *
 * The reference's Receipts screen carries this as "Material still to be
 * invoiced", and it is a value, not a quantity - the received weight priced at
 * what the purchase line agreed, dropping to zero once the supplier's invoice
 * is posted. Proved to the cent on thirteen rows across five suppliers:
 * 1 861 kg at EUR 2 050/TN shows EUR 3 815,05, and 706,5 kg at EUR 1 000/TN
 * shows EUR 706,50.
 *
 * This is the accrual behind Finance's "Purchase invoices to be received":
 * goods on our shelves that nobody has billed us for yet.
 */
export const materialStillToInvoice = ({
  status,
  kgReceived,
  pricePerUnit,
  priceUnit,
}: {
  status: ReceiptStatus | null;
  kgReceived: number;
  pricePerUnit: number;
  priceUnit: string | null;
}): number => {
  if (
    status === "invoiced" ||
    status === "expired" ||
    kgReceived <= 0 ||
    pricePerUnit <= 0
  ) {
    return 0;
  }
  return roundToCents(amountForWeight(pricePerUnit, priceUnit, kgReceived));
};

// ── The order-line price build-up ───────────────────────────────────────────
// The shape of the reference's `Pricing` panel, captured on order `100742`
// (`docs/reference-system/order-detail.md` §12). The left column builds a
// gross price out of four additive components; the right column takes three
// discounts off it to reach net.
//
// ⚠️ The arithmetic below is the panel's layout made literal, not a proof.
// Every box on the captured line read € 0,00 because that price was typed
// rather than built up, so the cascade is still numerically unverified against
// a real non-zero line. What IS certain from the panel is the ORDER of
// operations — line and extra discount subtotal first, and the group discount
// applies to what is left of the gross price afterwards, which is why the
// three percentages do not simply add together.

export type PriceBuildUp = {
  basePrice: number;
  quantitySurcharge: number;
  colorSurcharge: number;
  lengthSurcharge: number;
};

export type PriceDiscounts = {
  lineDiscount: number;
  lineDiscountUnit: DiscountUnit;
  extraDiscount: number;
  groupDiscount: number;
  groupDiscountUnit: DiscountUnit;
};

export type PriceCascade = {
  grossPrice: number;
  /** What line + extra together take off — the panel's `Line discount tot.` */
  lineDiscountTotalAmount: number;
  /** That same figure as a percentage of gross, which is how the panel shows it. */
  lineDiscountTotalPercent: number;
  groupDiscountAmount: number;
  netPrice: number;
};

/**
 * Gross price from its four components.
 *
 *     gross = base + quantity surcharge + colour surcharge + length surcharge
 */
export const grossPriceFromBuildUp = ({
  basePrice,
  quantitySurcharge,
  colorSurcharge,
  lengthSurcharge,
}: PriceBuildUp): number =>
  roundToCents(
    basePrice + quantitySurcharge + colorSurcharge + lengthSurcharge,
  );

/**
 * One discount applied to a base, in whichever unit it is denominated.
 *
 * A percentage scales with the base; an amount does not. The reference carries
 * a unit column beside each discount precisely so that a bare `5` is not read
 * as 5 % when € 5,00 was meant.
 */
export const discountAmount = (
  base: number,
  discount: number,
  unit: DiscountUnit,
): number =>
  roundToCents(unit === "percent" ? (base * discount) / 100 : discount);

/**
 * The whole cascade: four components up to gross, three discounts down to net.
 *
 * The extra discount is taken on the same base as the line discount — they are
 * subtotalled together before the group discount is applied — so the group
 * discount bites on the already-reduced price, not on gross.
 */
export const priceCascade = (
  buildUp: PriceBuildUp,
  discounts: PriceDiscounts,
): PriceCascade => {
  const grossPrice = grossPriceFromBuildUp(buildUp);

  const lineAmount = discountAmount(
    grossPrice,
    discounts.lineDiscount,
    discounts.lineDiscountUnit,
  );
  // The panel prints `Extra discount` with no unit column of its own, so it
  // follows the line discount's unit — the two share a subtotal row.
  const extraAmount = discountAmount(
    grossPrice,
    discounts.extraDiscount,
    discounts.lineDiscountUnit,
  );

  const lineDiscountTotalAmount = roundToCents(lineAmount + extraAmount);
  const afterLine = roundToCents(grossPrice - lineDiscountTotalAmount);

  const groupDiscountAmount = discountAmount(
    afterLine,
    discounts.groupDiscount,
    discounts.groupDiscountUnit,
  );

  return {
    grossPrice,
    lineDiscountTotalAmount,
    lineDiscountTotalPercent:
      grossPrice === 0
        ? 0
        : roundToCents((lineDiscountTotalAmount / grossPrice) * 100),
    groupDiscountAmount,
    netPrice: roundToCents(afterLine - groupDiscountAmount),
  };
};

// ---------------------------------------------------------------------------
// The month the visit schedule plans in
//
// The reference plans contact by month, not by day: its screen picks a month,
// and the `Call` and `Visit` boxes belong to that month rather than to any date
// in it. These turn a month into something printable and read one back out of
// a URL.
// ---------------------------------------------------------------------------

/** A month's name, or null when the number is not one of the twelve. */
export const monthLabel = (month: number | null | undefined): string | null => {
  if (month === null || month === undefined) {
    return null;
  }
  return MONTH_LABELS[month - 1] ?? null;
};

/** `September 2026` — how the schedule names the month it is planning for. */
export const monthAndYearLabel = (
  year: number | null | undefined,
  month: number | null | undefined,
): string | null => {
  const name = monthLabel(month);
  if (name === null || year === null || year === undefined) {
    return null;
  }
  return `${name} ${year}`;
};

/**
 * The month a computed date falls in, which is all the reference's `upcoming
 * month` columns ever showed. A date nobody could compute has no month.
 */
export const monthOfDate = (date: string | null | undefined): string | null => {
  const value = (date ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  return monthAndYearLabel(
    Number(value.slice(0, 4)),
    Number(value.slice(5, 7)),
  );
};

/**
 * The month a schedule screen is showing, from the URL. Anything missing or
 * out of range falls back to the month we are in, so a hand-typed link lands on
 * this month rather than on an empty one.
 */
export const visitPlanPeriod = (
  year: string | string[] | null | undefined,
  month: string | string[] | null | undefined,
): { year: number; month: number } => {
  const now = new Date();
  const first = (value: string | string[] | null | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const parsedYear = Number(first(year));
  const parsedMonth = Number(first(month));
  const validYear =
    Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100;
  const validMonth =
    Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12;

  return {
    year: validYear ? parsedYear : now.getFullYear(),
    month: validMonth ? parsedMonth : now.getMonth() + 1,
  };
};

/**
 * A contact's name as the contact screens print it: the title, then the first
 * and last name, skipping whatever is missing. Null when nothing is recorded,
 * so a caller can decide what an unnamed contact looks like.
 */
export const contactPersonName = (contact: {
  salutation?: ContactSalutation | null;
  firstName?: string | null;
  lastName?: string | null;
}): string | null => {
  const parts = [
    contact.salutation ? CONTACT_SALUTATION_LABELS[contact.salutation] : null,
    contact.firstName,
    contact.lastName,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : null;
};

/**
 * Whether a reported figure is close enough to the planned one.
 *
 * 🔴 The reference carries a tolerance table **per product**, read off
 * `PK44115025125` on 2-10-2026:
 *
 * ```
 * Workorder type        Qty    Kg
 * Unloading wo          5%     5%
 * Count workorder       0%     0%
 * Picking workorder     5%     5%
 * Production workorder   —     0%
 * ```
 *
 * Three different rules, and the differences are the point. A count must be
 * exact or it is not a count. A production job must close its kilo balance
 * exactly. A picking or an unloading may be 5 % out either way — which is the
 * slack that absorbs the 1,911 % gap between the trade and theoretical
 * densities, and the 2–4 % by which cold-rolled coil runs under nominal.
 *
 * `null` means the reference leaves that cell **blank** — production has no
 * quantity tolerance at all — and is not the same as `0`, which means it must
 * match to the last decimal.
 */
export const isWithinTolerance = (
  planned: number,
  reported: number,
  tolerancePercent: number,
): boolean => {
  const allowed = Math.abs(planned) * (tolerancePercent / 100);
  // Decimal strings that have been through `toFixed` land a hair either side of
  // the boundary, so an exact-match rule has to survive its own arithmetic.
  return Math.abs(reported - planned) <= allowed + 1e-9;
};

/**
 * A tolerance cell as a number, or `null` when the product leaves it blank.
 *
 * Blank is not zero: zero is a rule, blank is the absence of one.
 */
export const tolerancePercent = (value: string | null): number | null =>
  value === null || value.trim() === "" ? null : Number(value);

/**
 * The weight of one piece of a **specific lot**, from that lot's own dimensions.
 *
 * 🔑 Weight is `lot dimensions × density`, not `product dimensions × density`.
 *
 * Proved on the reference's own `Stock` search dialog, 2-10-2026: a lot of
 * nominal 1,50 mm plate measures **1,44 mm** and the screen weighs it
 * `2,5 × 1,25 × 0,00144 × 7 850 = 35,325 kg` — exactly, and exactly the 35,325
 * recorded against that lot everywhere else. Cold-rolled metal comes in under
 * nominal and the lot records what it really measures.
 *
 * `productPieceWeightKg` cannot be used for this: it returns the product's
 * stored per-piece figure before it ever looks at the dimensions it is handed,
 * so a lot's own measurements are silently discarded. This one prefers them, and
 * only falls back to the product when the lot has none — or when the lot is a
 * coil, whose length is a sentinel rather than a measurement.
 */
export const lotPieceWeightKg = (
  product: {
    weightTheoretical?: string | number | null;
    theoreticalWeight?: string | number | null;
    weightUnit?: SalesUnit | null;
    lengthMm?: number | null;
    widthMm?: number | null;
    thicknessMm?: string | number | null;
  },
  lot: {
    lengthMm?: number | null;
    widthMm?: number | null;
    thicknessMm?: string | number | null;
  },
): number | null => {
  const lengthMm = lot.lengthMm ?? 0;
  const widthMm = lot.widthMm ?? 0;
  const thicknessMm = Number(lot.thicknessMm ?? 0);

  const measured =
    lengthMm > 0 &&
    lengthMm !== COIL_LENGTH_SENTINEL &&
    widthMm > 0 &&
    thicknessMm > 0;

  if (measured) {
    const fromLot = theoreticalPieceWeightKg({
      theoreticalWeight: product.theoreticalWeight,
      weightUnit: product.weightUnit,
      lengthMm,
      widthMm,
      thicknessMm,
    });
    if (fromLot !== null && fromLot > 0) {
      return fromLot;
    }
  }

  return productPieceWeightKg({
    weightTheoretical: product.weightTheoretical,
    theoreticalWeight: product.theoreticalWeight,
    weightUnit: product.weightUnit,
    lengthMm: product.lengthMm,
    widthMm: product.widthMm,
    thicknessMm: product.thicknessMm,
  });
};

/**
 * The weight of one piece of an article, derived from geometry first.
 *
 * 🔴 `productPieceWeightKg` reads a **stored** figure — `weight_theoretical`,
 * which the product form computes and writes on save. Every article that
 * arrived by import instead of through that form has it empty, and on
 * 3-10-2026 that was 5 624 of 5 626 products. A purchase line priced per tonne
 * against one of them weighed nothing and billed EUR 0,00, and the receival
 * raised behind it planned zero kilos.
 *
 * So geometry comes first here: shape, dimensions and density reproduce the
 * figure the product form would have stored, and the stored column is only a
 * fallback for the articles geometry cannot describe — a beam, whose section
 * comes from a profile table this system does not hold.
 *
 * `override` carries the **line's** own dimensions, which win over the
 * catalogue's. A document line may be struck at a size the article is not
 * normally stocked in, and it is the line that was ordered.
 */
export const articlePieceWeightKg = (
  product: {
    dimensionShape?: ProductDimensionShape | null;
    featuresQuality?: FeaturesQuality | string | null;
    densityKgDm3?: string | number | null;
    length?: string | number | null;
    widthDiameter?: string | number | null;
    thickness?: string | number | null;
    theoreticalThickness?: string | number | null;
    weightTheoretical?: string | number | null;
    theoreticalWeight?: string | number | null;
    weightUnit?: SalesUnit | null;
  },
  override?: {
    lengthMm?: string | number | null;
    widthMm?: string | number | null;
    thicknessMm?: string | number | null;
  },
): number | null => {
  const pick = (
    first: string | number | null | undefined,
    second: string | number | null | undefined,
  ): number => {
    const chosen = Number(first ?? 0);
    return chosen > 0 ? chosen : Number(second ?? 0);
  };

  const length = pick(override?.lengthMm, product.length);
  const widthDiameter = pick(override?.widthMm, product.widthDiameter);
  // The metal's rolled thickness beats its nominal one, for the reason
  // `theoreticalPieceWeightKg` sets out — but only when the line did not state
  // a thickness of its own, which is a measurement rather than a nominal size.
  const stated = Number(override?.thicknessMm ?? 0);
  const rolled = Number(product.theoreticalThickness ?? 0);
  const thickness =
    stated > 0 ? stated : rolled > 0 ? rolled : Number(product.thickness ?? 0);

  // A coil's length is a sentinel, not a measurement, so its volume cannot be
  // read off it. Such a line falls through to whatever the article stores.
  const measurable = length > 0 && length !== COIL_LENGTH_SENTINEL;

  if (measurable) {
    const derived = deriveArticleWeights(
      product.dimensionShape,
      { length, widthDiameter, thickness },
      product.featuresQuality,
      Number(product.densityKgDm3 ?? 0) || null,
    );
    if (
      derived.weightTheoretical !== undefined &&
      derived.weightTheoretical > 0
    ) {
      return derived.weightTheoretical;
    }
  }

  return productPieceWeightKg({
    weightTheoretical: product.weightTheoretical,
    theoreticalWeight: product.theoreticalWeight,
    weightUnit: product.weightUnit,
    lengthMm: length > 0 ? length : null,
    widthMm: widthDiameter > 0 ? widthDiameter : null,
    thicknessMm: thickness > 0 ? thickness : null,
  });
};
/**
 * Where a lot originally came from, for stamping onto a movement.
 *
 * 🔴 The reference's `Stock mutations` names the **supplier and the purchase
 * order** on outbound delivery rows as well as inbound ones — a delivery to
 * Bergen Stainless on 14-8-2026 still reads `Supplier: Swedinox`,
 * `Purchase order: IO403283`. Origin travels with the metal all the way out of
 * the building.
 *
 * ⚠️ Spread this at write time rather than joining through the lot later. A lot
 * drawn to zero is precisely when somebody asks where its steel came from.
 */
export const lotOrigin = (lot: {
  supplierUuid?: string | null;
  purchaseOrderUuid?: string | null;
}) => ({
  originSupplierUuid: lot.supplierUuid ?? null,
  originPurchaseOrderUuid: lot.purchaseOrderUuid ?? null,
});

/**
 * The price units that are struck on weight, and so cannot be turned into an
 * amount without one.
 *
 * Almost every purchase line is one of these — steel is bought by the tonne —
 * which is why a product with no weight silently produces a € 0,00 order rather
 * than an obviously wrong one.
 */
export const WEIGHT_PRICE_UNITS = ["KG", "TN", "HK"] as const;

export const isWeightPriceUnit = (priceUnit: string | null | undefined) =>
  WEIGHT_PRICE_UNITS.includes(
    (priceUnit ?? "").trim().toUpperCase() as (typeof WEIGHT_PRICE_UNITS)[number],
  );

/**
 * The read-only ledger every lot dialog opens with.
 *
 * Captured 5-10-2026. `Verplaatsen`, `Overboeken` and `Splits` all begin with
 * the same block, and it is the single most important thing on the dialog —
 * it states what the action is allowed to touch before you type anything:
 *
 *   Technische voorraad:              25
 *   Beschikbaar:                       0
 *     Geplande verplaatsingen:         0
 *     Beschikbaar en verplaatsbaar:    0
 *   Gereserveerd:                     25
 *     Met onderhanden opdrachten:      0
 *     Geplande verplaatsingen:         0
 *     Gereserveerd en verplaatsbaar:  25
 *   Totaal verplaatsbaar:             25
 *
 * 🔑 **`Technical = Reserved + Available`**, on every dialog and in the location
 * grid — confirmed on neighbouring rows as `3 = 3 + 0` and `9 = 0 + 9`.
 *
 * 🔑 **Reserved stock is movable and splittable.** `Gereserveerd en
 * verplaatsbaar` read 25 on a lot that was reserved in full, because a
 * reservation binds the *lot*, not the shelf. Only two things subtract: metal
 * already on an open work order (`Met onderhanden opdrachten`) and metal
 * already scheduled to move (`Geplande verplaatsingen`).
 *
 * That second line is why a relocation is an *order* rather than a movement —
 * raising one commits the metal, so the next dialog has to be able to see it.
 */
export type LotLedger = {
  technical: number;
  available: number;
  availablePlannedMoves: number;
  availableAndMovable: number;
  reserved: number;
  reservedOnOpenWorkOrders: number;
  reservedPlannedMoves: number;
  reservedAndMovable: number;
  /** The bold total at the bottom, and the ceiling on the quantity field. */
  totalMovable: number;
};

export type LotLedgerInput = {
  quantity: string | number | null | undefined;
  reservedQuantity: string | number | null | undefined;
  /** Already committed to an open warehouse or production work order. */
  onOpenWorkOrders?: number;
  /** Already on a relocation or transfer order that has not been executed. */
  plannedMoves?: number;
};

export const lotLedger = ({
  quantity,
  reservedQuantity,
  onOpenWorkOrders = 0,
  plannedMoves = 0,
}: LotLedgerInput): LotLedger => {
  const technical = Number(quantity ?? 0);
  const reserved = Number(reservedQuantity ?? 0);
  const available = Math.max(technical - reserved, 0);

  // Commitments are charged against the free metal first and only then against
  // the reserved, which is the order the reference's own two sub-lines imply:
  // the free pile is what a planner would take from before touching somebody's
  // claim. Anything that cannot fit under `Available` spills into the reserved
  // half rather than vanishing.
  const availablePlannedMoves = Math.min(plannedMoves, available);
  const reservedPlannedMoves = plannedMoves - availablePlannedMoves;
  const reservedOnOpenWorkOrders = Math.min(onOpenWorkOrders, reserved);

  const availableAndMovable = Math.max(available - availablePlannedMoves, 0);
  const reservedAndMovable = Math.max(
    reserved - reservedOnOpenWorkOrders - reservedPlannedMoves,
    0,
  );

  return {
    technical,
    available,
    availablePlannedMoves,
    availableAndMovable,
    reserved,
    reservedOnOpenWorkOrders,
    reservedPlannedMoves,
    reservedAndMovable,
    totalMovable: availableAndMovable + reservedAndMovable,
  };
};

/**
 * The weighbridge, as the lot dialogs state it.
 *
 * Four weights live on one lot and all four disagreed on the captured bundle:
 * theoretical 1 766,25 · weighed 1 754 · gross 1 798 · net 1 754. The two rules
 * that hold between them are `gross − tare = net` and `net = weighed`, which
 * makes the tare 44 kg of packing.
 *
 * The tare is **derived, never stored**: storing it as a fifth number would let
 * it disagree with the three it comes from.
 *
 * `weighed ≠ theoretical` is not an error to be corrected — it is the drift a
 * purchase invoice is billed on, since the order's printed terms accept only
 * the weighed weight as the basis for invoicing.
 */
export type LotWeights = {
  theoreticalKg: number | null;
  weighedKg: number | null;
  grossKg: number | null;
  netKg: number | null;
  /** `gross − net`, once both are known. */
  tareKg: number | null;
  /** `weighed − theoretical` — the gap the invoice is billed on. */
  driftKg: number | null;
  /** Whether `net` and `weighed` agree, as the reference's own lot did. */
  netMatchesWeighed: boolean | null;
};

const weightOrNull = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const lotWeights = (lot: {
  quantityKg?: string | number | null;
  weighedWeightKg?: string | number | null;
  grossWeightKg?: string | number | null;
  netWeightKg?: string | number | null;
}): LotWeights => {
  const theoreticalKg = weightOrNull(lot.quantityKg);
  const weighedKg = weightOrNull(lot.weighedWeightKg);
  const grossKg = weightOrNull(lot.grossWeightKg);
  const netKg = weightOrNull(lot.netWeightKg);

  return {
    theoreticalKg,
    weighedKg,
    grossKg,
    netKg,
    tareKg:
      grossKg !== null && netKg !== null
        ? Number((grossKg - netKg).toFixed(3))
        : null,
    driftKg:
      weighedKg !== null && theoreticalKg !== null
        ? Number((weighedKg - theoreticalKg).toFixed(3))
        : null,
    netMatchesWeighed:
      netKg !== null && weighedKg !== null
        ? Math.abs(netKg - weighedKg) < 0.001
        : null,
  };
};
