import { z } from "zod";

// `Adjust charge…` (the reference's *Charge aanpassen*): new heat number, new
// sheet number, and optionally an existing internal charge to move under.
export const adjustChargeSchema = z.object({
  charge: z.string().max(100, "At most 100 characters"),
  sheetNumber: z.string().max(100, "At most 100 characters"),
  internalCharge: z.string(),
});

export type AdjustChargeValues = z.infer<typeof adjustChargeSchema>;
