import { z } from "zod";
import {
  DECIMAL_AMOUNT_PATTERN,
  DECIMAL_QUANTITY_PATTERN,
} from "@/lib/helpers";

const asNumeric = (value: string) => Number(value.trim().replace(",", "."));

// A typed quantity. Either separator is accepted — a keyboard set to a Dutch
// locale types `3,999` — and the scale is capped at what the column holds, so
// a fourth decimal is refused here rather than rounded away on the way in.
const quantity = (label: string) =>
  z
    .string()
    .refine(
      (value) => DECIMAL_QUANTITY_PATTERN.test(value.trim()),
      `${label} must be a number with at most three decimals`,
    )
    .refine((value) => asNumeric(value) >= 0, `${label} cannot be negative`);

const requiredQuantity = (label: string) =>
  quantity(label).refine(
    (value) => asNumeric(value) > 0,
    `${label} has to be more than zero`,
  );

// Blank means "nothing said about this row" and is dropped later, so it has to
// survive validation. Zero does not mean blank: it is how a delivery is
// cancelled, and it must reach the action.
const optionalQuantity = (label: string) =>
  z
    .string()
    .optional()
    .refine(
      (value) =>
        value === undefined ||
        value.trim() === "" ||
        DECIMAL_QUANTITY_PATTERN.test(value.trim()),
      `${label} must be a number with at most three decimals`,
    )
    .refine(
      (value) =>
        value === undefined || value.trim() === "" || asNumeric(value) >= 0,
      `${label} cannot be negative`,
    );

// Always present as a field, but allowed to be blank. Blank says nothing about
// the row and is dropped; zero says the floor looked and found nothing. The
// field stays a plain string so neither can collapse into `undefined`.
const reportedQuantity = (label: string) =>
  z
    .string()
    .refine(
      (value) =>
        value.trim() === "" || DECIMAL_QUANTITY_PATTERN.test(value.trim()),
      `${label} must be a number with at most three decimals`,
    )
    .refine(
      (value) => value.trim() === "" || asNumeric(value) >= 0,
      `${label} cannot be negative`,
    );

const optionalWeight = (label: string) =>
  z
    .string()
    .optional()
    .refine(
      (value) =>
        value === undefined ||
        value.trim() === "" ||
        DECIMAL_AMOUNT_PATTERN.test(value.trim()),
      `${label} must be a number with at most two decimals`,
    )
    .refine(
      (value) =>
        value === undefined || value.trim() === "" || asNumeric(value) >= 0,
      `${label} cannot be negative`,
    );

export const workOrderLineSchema = z.object({
  stockUuid: z.string().min(1, "Choose the lot the goods come from"),
  toLocationUuid: z.string().optional(),
  qtyPlanned: requiredQuantity("Quantity"),
  kgPlanned: optionalWeight("Kg"),
  orderNumber: z.string().optional(),
  priority: z.string().optional(),
  rush: z.boolean(),
});

export type WorkOrderLineFormValues = z.infer<typeof workOrderLineSchema>;

// A prepared row says where part of the line will be drawn from. The quantities
// are strings because they come straight off the form; the action is what
// checks them against the lot.
export const preparePickSchema = z.object({
  stockUuid: z.string().optional(),
  qtyPlanned: optionalQuantity("Quantity"),
  kgPlanned: optionalWeight("Kg"),
});

export const prepareLineSchema = z.object({
  picks: z.array(preparePickSchema),
});

export type PrepareLineFormValues = z.infer<typeof prepareLineSchema>;

// An empty actual means "nothing said about this row" and is dropped. Zero is a
// real answer — it is how a delivery is cancelled — so it must survive.
export const reportPickSchema = z.object({
  uuid: z.string().optional(),
  // Which parcel this row came off. Chosen per row rather than per line,
  // because `+ New` on the reference's dialog is how one planned line is
  // reported as several parcels — and the second parcel is routinely a
  // different lot on a different shelf.
  stockUuid: z.string().optional(),
  qtyPlanned: z.string(),
  qtyActual: reportedQuantity("Actual quantity"),
  kgActual: optionalWeight("Actual kg"),
  charge: z.string().optional(),
  internalCharge: z.string().optional(),
  internalBatch: z.string().optional(),
});

export const reportCompletionSchema = z.object({
  executedAt: z.string().min(1, "Say when it was done"),
  // The reference's `Executed on:` is a datetime and opens on the minute the
  // dialog was opened — `30-9-2026 17:59`. A picking reported at 08:05 and one
  // reported at 17:59 are a shift apart, and a date alone cannot tell them.
  executedTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 17:59"),
  // `By:` — the operator. Blank in the reference and not mandatory there
  // either, so an unnamed report is a report, not an error.
  executedByUserId: z.string().optional(),
  // `To Location:`, which the reference defaults to `Laad` and lets the floor
  // change. Blank falls back to what the line already says.
  toLocationUuid: z.string().optional(),
  picks: z.array(reportPickSchema),
});

export type ReportCompletionFormValues = z.infer<typeof reportCompletionSchema>;
