import { z } from "zod";
import { remainderCategories } from "@/lib/enums";
import {
  DECIMAL_AMOUNT_PATTERN,
  DECIMAL_QUANTITY_PATTERN,
} from "@/lib/helpers";

const asNumeric = (value: string) => Number(value.trim().replace(",", "."));

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

const reportedWeight = (label: string) =>
  z
    .string()
    .refine(
      (value) =>
        value.trim() === "" || DECIMAL_AMOUNT_PATTERN.test(value.trim()),
      `${label} must be a number with at most two decimals`,
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
    );

// --- reporting a treatment ------------------------------------------------

export const reportTreatmentPickSchema = z.object({
  uuid: z.string().optional(),
  stockUuid: z.string().optional(),
  qtyPlanned: z.string(),
  qtyActual: reportedQuantity("Actual quantity"),
  kgActual: optionalWeight("Actual kg"),
  charge: z.string().optional(),
  internalCharge: z.string().optional(),
  internalBatch: z.string().optional(),
});

export const reportTreatmentSchema = z.object({
  executedAt: z.string().min(1, "Say when it was done"),
  picks: z.array(reportTreatmentPickSchema),
});

export type ReportTreatmentFormValues = z.infer<typeof reportTreatmentSchema>;

// --- reporting a cut -------------------------------------------------------
//
// The figures are validated for shape here and for balance in the action. The
// browser can say "that is not a number"; only the server can say whether the
// kilos reconcile, because only it knows what the lots are carrying.

export const reportCutFetchedSchema = z.object({
  uuid: z.string().optional(),
  stockUuid: z.string().min(1, "Choose the lot this came out of"),
  qtyActual: reportedQuantity("Quantity"),
  kgActual: reportedWeight("Kg"),
});

export const reportCutComponentSchema = z.object({
  lineUuid: z.string(),
  qtyActual: reportedQuantity("Quantity"),
  kgActual: reportedWeight("Kg"),
});

export const reportCutRemainderSchema = z.object({
  category: z.enum(remainderCategories),
  productUuid: z.string().optional(),
  quantity: reportedQuantity("Quantity"),
  kg: reportedWeight("Kg"),
  toLocationUuid: z.string().optional(),
  remark: z.string().optional(),
});

export const reportCutSchema = z.object({
  executedAt: z.string().min(1, "Say when it was done"),
  fetched: z
    .array(reportCutFetchedSchema)
    .min(1, "Say what went to the machine"),
  components: z.array(reportCutComponentSchema),
  remainders: z.array(reportCutRemainderSchema),
});

export type ReportCutFormValues = z.infer<typeof reportCutSchema>;
