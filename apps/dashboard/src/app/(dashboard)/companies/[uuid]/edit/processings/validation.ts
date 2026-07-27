import { deliveryTimeUnits, processingEditings } from "@/lib/enums";
import { z } from "zod";

// Row values for the inline processings grid. The legacy mega-form had no
// per-row schema (rows lived in plain component state), so this schema is
// new — it validates the same shape the grid edits.
export const processingRowSchema = z.object({
  editing: z.union([z.enum(processingEditings), z.literal("")]),
  preference: z.boolean(),
  supplierUuid: z.string(),
  deliveryTime: z.number(),
  deliveryTimeUnit: z.union([z.enum(deliveryTimeUnits), z.literal("")]),
  processorLocation: z.string(),
});

export type ProcessingRowValues = z.infer<typeof processingRowSchema>;

// The same blank-row defaults the legacy addProcessing handler applied
// (empty selects map to "" here instead of undefined).
export const DEFAULT_PROCESSING_ROW: ProcessingRowValues = {
  editing: "",
  preference: false,
  supplierUuid: "",
  deliveryTime: 0,
  deliveryTimeUnit: "",
  processorLocation: "",
};
